import { visit } from "unist-util-visit";
import type {
  Root,
  RootContent,
  PhrasingContent,
  Heading,
  List,
  ListItem,
  Text,
} from "mdast";
import type {
  BodyElement,
  Run,
  SemanticModel,
  TitlePageContent,
  AbstractContent,
  FormattedReference,
  ReferenceEntry,
  AuthorEntry,
  JournalArticleRef,
  BookRef,
  EditedBookRef,
  BookChapterRef,
  WebPageRef,
  ConferencePresentationRef,
  DissertationRef,
  TechnicalReportRef,
} from "./types.js";
import type { ParsedDocument } from "./parse.js";

export function transform(parsed: ParsedDocument): SemanticModel {
  const { frontmatter: fm, mdast } = parsed;
  const references = fm.references ?? {};

  const titlePage: TitlePageContent = {
    title: fm.title,
    author: Array.isArray(fm.author) ? fm.author : [fm.author],
    affiliation: fm.affiliation
      ? Array.isArray(fm.affiliation)
        ? fm.affiliation
        : [fm.affiliation]
      : undefined,
    course: fm.course,
    instructor: fm.instructor,
    date: fm.date,
    paperType: fm.paper_type ?? "student",
    runningHead: fm.running_head?.toUpperCase(),
  };

  let abstract: AbstractContent | undefined;
  if (fm.abstract) {
    abstract = {
      text: fm.abstract,
      keywords: fm.keywords,
    };
  }

  const citeKeys = collectCitationKeys(mdast);
  const citedRefs = collectCitedReferences(citeKeys, references);

  // Walk mdast and build body elements
  const body: BodyElement[] = [];

  visit(mdast, (node) => {
    if (node.type === "yaml") return;

    if (node.type === "heading") {
      const heading = node as Heading;
      const text = extractText(heading);

      // References section is auto-generated from frontmatter — skip heading and everything after
      if (isReferencesHeading(text)) {
        return;
      }

      const apaLevel = mapHeadingLevel(heading.depth);
      body.push({ type: "heading", level: apaLevel, text });
      return;
    }

    if (node.type === "paragraph") {
      const runs = processInline(node, references);
      body.push({ type: "paragraph", runs });
      return;
    }

    if (node.type === "blockquote") {
      const children = processBlockChildren(node, references);
      body.push({ type: "block_quote", children });
      return;
    }

    if (node.type === "list") {
      const list = node as List;
      const ordered = list.ordered ?? false;
      const items = list.children.map((li: ListItem) =>
        processBlockChildren(li, references),
      );
      if (ordered) {
        body.push({
          type: "ordered_list",
          start: list.start ?? 1,
          items,
        });
      } else {
        body.push({ type: "bullet_list", items });
      }
      return;
    }

    if (node.type === "thematicBreak") {
      body.push({ type: "page_break" });
      return;
    }
  });

  return {
    meta: fm,
    titlePage,
    abstract,
    body,
    references: citedRefs,
  };
}

function isReferencesHeading(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return lower === "references" || lower === "reference";
}

function mapHeadingLevel(mdDepth: number): 1 | 2 | 3 | 4 | 5 {
  if (mdDepth <= 1) return 1;
  if (mdDepth === 2) return 2;
  if (mdDepth === 3) return 3;
  if (mdDepth === 4) return 4;
  return 5;
}

function extractText(node: Heading | PhrasingContent): string {
  if (node.type === "text") return (node as Text).value;
  if ("children" in node && node.children) {
    return (node.children as PhrasingContent[])
      .map((child) => extractText(child))
      .join("");
  }
  if ("value" in node && typeof node.value === "string") return node.value;
  return "";
}

function processInline(
  node: { children?: PhrasingContent[] },
  references: Record<string, ReferenceEntry>,
): Run[] {
  const runs: Run[] = [];

  for (const child of node.children ?? []) {
    if (child.type === "text") {
      const textRuns = expandCitations(child.value, references);
      runs.push(...textRuns);
    } else if (child.type === "strong") {
      const inner = processInline(child, references).map((r) => ({
        ...r,
        bold: true,
      }));
      runs.push(...inner);
    } else if (child.type === "emphasis") {
      const inner = processInline(child, references).map((r) => ({
        ...r,
        italic: true,
      }));
      runs.push(...inner);
    } else if (child.type === "link") {
      // Links: render as "text (url)" since APA doesn't use hyperlinks in body
      const linkText = extractText(child);
      runs.push({ text: linkText });
      if (child.url) {
        runs.push({ text: ` (${child.url})` });
      }
    } else if (child.type === "inlineCode") {
      runs.push({ text: child.value });
    } else if (child.type === "break") {
      runs.push({ text: "\n" });
    }
  }

  return runs;
}

function expandCitations(
  text: string,
  references: Record<string, ReferenceEntry>,
): Run[] {
  const runs: Run[] = [];
  const regex = /\[@([\w;@.\s-]+?)\]|@(\w+)(?:\[([^\]]*)\])?/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // Parenthetical: [@key1; @key2]
      const keys = match[1].split(";").map((k) => k.trim().replace(/^@/, ""));
      runs.push(...formatParentheticalCitation(keys, match, references));
    } else if (match[2] !== undefined) {
      // Narrative: @key
      const key = match[2];
      const ref = references[key];
      const location = match[3] ?? undefined;

      if (ref) {
        runs.push(...formatNarrativeCitation(ref, location));
      } else {
        runs.push({ text: `@${key}`, italic: true });
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex) });
  }

  return runs;
}

function formatParentheticalCitation(
  keys: string[],
  _match: RegExpExecArray,
  references: Record<string, ReferenceEntry>,
): Run[] {
  const runs: Run[] = [];
  runs.push({ text: "(" });

  const sortedKeys = [...keys].sort((a, b) => {
    const refA = references[a];
    const refB = references[b];
    const authorA = refA ? getSortKey(refA) : a;
    const authorB = refB ? getSortKey(refB) : b;
    return authorA.localeCompare(authorB);
  });

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const ref = references[key];

    if (i > 0) runs.push({ text: "; " });

    if (ref) {
      const authorStr = formatAuthorCitation(ref, "parenthetical");
      runs.push({ text: `${authorStr}, ${formatYear(ref)}` });
    } else {
      runs.push({ text: key, italic: true });
    }
  }

  runs.push({ text: ")" });
  return runs;
}

function formatNarrativeCitation(ref: ReferenceEntry, location?: string): Run[] {
  const runs: Run[] = [];
  const authorStr = formatAuthorCitation(ref, "narrative");
  runs.push({ text: authorStr });
  runs.push({ text: ` (${formatYear(ref)}` });

  if (location) {
    runs.push({ text: `, ${location}` });
  }

  runs.push({ text: ")" });
  return runs;
}

function formatAuthorCitation(
  ref: ReferenceEntry,
  mode: "narrative" | "parenthetical",
): string {
  const authors = ref.author;
  const connector = mode === "parenthetical" ? "&" : "and";

  if (authors.length === 1) {
    return getAuthorName(authors[0]);
  }

  if (authors.length === 2) {
    return `${getAuthorName(authors[0])} ${connector} ${getAuthorName(authors[1])}`;
  }

  return `${getAuthorName(authors[0])} et al.`;
}

function getAuthorName(author: AuthorEntry): string {
  if (typeof author === "string") return author;
  return author.organization;
}

function formatYear(ref: ReferenceEntry): string {
  if (typeof ref.year === "number") return String(ref.year);
  return ref.year; // "n.d." or "in press"
}

// --- Reference formatting ---

export function collectCitationKeys(mdast: Root): Set<string> {
  const keys = new Set<string>();
  visit(mdast, "text", (node: Text) => {
    const regex = /@(\w+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(node.value)) !== null) {
      keys.add(match[1]);
    }
  });
  // Also check parenthetical citations: [@key1; @key2]
  visit(mdast, "text", (node: Text) => {
    const regex = /\[@([\w;@.\s-]+?)\]/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(node.value)) !== null) {
      match[1].split(";").forEach((k) => {
        keys.add(k.trim().replace(/^@/, ""));
      });
    }
  });
  return keys;
}

function collectCitedReferences(
  citedKeys: Set<string>,
  references: Record<string, ReferenceEntry>,
): FormattedReference[] {
  const formatted: FormattedReference[] = [];

  for (const key of Object.keys(references)) {
    const ref = references[key];
    const sortKey = getSortKey(ref);
    const runs = formatReferenceEntry(key, ref);
    formatted.push({ key, runs, sortKey });
  }

  formatted.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return formatted;
}

function getSortKey(ref: ReferenceEntry): string {
  const firstAuthor = ref.author[0];
  const lastName =
    typeof firstAuthor === "string"
      ? firstAuthor.includes(",")
        ? firstAuthor.split(",")[0].trim()
        : firstAuthor
      : firstAuthor.organization;
  return `${lastName.toLowerCase()}, ${ref.year}`;
}

function formatReferenceEntry(key: string, ref: ReferenceEntry): Run[] {
  switch (ref.type) {
    case "journal_article":
      return formatJournalArticle(ref as JournalArticleRef);
    case "book":
      return formatBook(ref as BookRef);
    case "edited_book":
      return formatEditedBook(ref as EditedBookRef);
    case "book_chapter":
      return formatBookChapter(ref as BookChapterRef);
    case "web_page":
      return formatWebPage(ref as WebPageRef);
    case "conference_presentation":
      return formatConferencePresentation(ref as ConferencePresentationRef);
    case "dissertation":
      return formatDissertation(ref as DissertationRef);
    case "technical_report":
      return formatTechnicalReport(ref as TechnicalReportRef);
    default:
      return [{ text: `[Unknown reference type: ${(ref as ReferenceEntry).type}]` }];
  }
}

function formatAuthorList(ref: ReferenceEntry): Run[] {
  const runs: Run[] = [];
  const authors = ref.author;

  if (authors.length === 1) {
    runs.push({ text: getAuthorName(authors[0]) });
  } else if (authors.length === 2) {
    const first = getAuthorName(authors[0]);
    const second = getAuthorName(authors[1]);
    runs.push({ text: `${first}, & ${second}` });
  } else if (authors.length <= 20) {
    for (let i = 0; i < authors.length; i++) {
      const name = getAuthorName(authors[i]);
      if (i === authors.length - 1) {
        runs.push({ text: `, & ${name}` });
      } else {
        runs.push({ text: i === 0 ? name : `, ${name}` });
      }
    }
  } else {
    for (let i = 0; i < 19; i++) {
      const name = getAuthorName(authors[i]);
      runs.push({ text: i === 0 ? name : `, ${name}` });
    }
    const last = getAuthorName(authors[authors.length - 1]);
    runs.push({ text: `, . . . , ${last}` });
  }

  return runs;
}

function formatJournalArticle(ref: JournalArticleRef): Run[] {
  const runs: Run[] = [];

  runs.push(...formatAuthorList(ref));
  runs.push({ text: ` (${ref.year}). ` });
  runs.push({ text: toSentenceCase(ref.title) });
  runs.push({ text: `. ` });

  // Journal name and volume in italics
  runs.push({ text: ref.journal, italic: true });

  if (ref.volume !== undefined) {
    runs.push({ text: `, `, italic: true });
    runs.push({ text: String(ref.volume), italic: true });
  }

  if (ref.issue !== undefined) {
    runs.push({ text: `(${ref.issue})` });
  }

  if (ref.pages) {
    runs.push({ text: `, ${ref.pages}` });
  }

  runs.push({ text: "." });

  if (ref.doi) {
    runs.push({ text: ` https://doi.org/${ref.doi}` });
  } else if (ref.url) {
    runs.push({ text: ` ${ref.url}` });
  }

  return runs;
}

function formatBook(ref: BookRef): Run[] {
  const runs: Run[] = [];

  runs.push(...formatAuthorList(ref));
  runs.push({ text: ` (${ref.year}). ` });
  runs.push({ text: ref.title, italic: true });

  if (ref.edition) {
    runs.push({ text: ` (${ordinal(ref.edition)} ed.)` });
  }

  runs.push({ text: `. ${ref.publisher}.` });

  if (ref.doi) {
    runs.push({ text: ` https://doi.org/${ref.doi}` });
  } else if (ref.url) {
    runs.push({ text: ` ${ref.url}` });
  }

  return runs;
}

function formatEditedBook(ref: EditedBookRef): Run[] {
  const runs: Run[] = [];

  runs.push(...formatAuthorList(ref));
  runs.push({ text: ` (${ref.year}). ` });
  runs.push({ text: ref.title, italic: true });

  if (ref.edition) {
    runs.push({ text: ` (${ordinal(ref.edition)} ed.)` });
  }

  runs.push({ text: `. ${ref.publisher}.` });

  if (ref.doi) {
    runs.push({ text: ` https://doi.org/${ref.doi}` });
  }

  return runs;
}

function formatBookChapter(ref: BookChapterRef): Run[] {
  const runs: Run[] = [];

  runs.push(...formatAuthorList(ref));
  runs.push({ text: ` (${ref.year}). ` });
  runs.push({ text: toSentenceCase(ref.title) });
  runs.push({ text: `. In ` });

  const editors = ref.editor;
  if (editors.length === 1) {
    const ed = getAuthorName(editors[0]);
    runs.push({ text: `${ed} (Ed.), ` });
  } else {
    for (let i = 0; i < editors.length; i++) {
      const name = getAuthorName(editors[i]);
      if (i === editors.length - 1) {
        runs.push({ text: `& ${name} (Eds.), ` });
      } else if (i === 0) {
        runs.push({ text: name });
      } else {
        runs.push({ text: `, ${name}` });
      }
    }
  }

  runs.push({ text: ref.book_title, italic: true });

  if (ref.edition) {
    runs.push({ text: ` (${ordinal(ref.edition)} ed.)` });
  }

  runs.push({ text: ` (pp. ${ref.pages})` });
  runs.push({ text: `. ${ref.publisher}.` });

  if (ref.doi) {
    runs.push({ text: ` https://doi.org/${ref.doi}` });
  }

  return runs;
}

function formatWebPage(ref: WebPageRef): Run[] {
  const runs: Run[] = [];

  runs.push(...formatAuthorList(ref));
  runs.push({ text: ` (${ref.year}). ` });
  runs.push({ text: toSentenceCase(ref.title) });
  runs.push({ text: `. ` });

  if (ref.website) {
    runs.push({ text: ref.website, italic: true });
    runs.push({ text: `. ` });
  }

  if (ref.retrieval_date) {
    runs.push({ text: `Retrieved ${ref.retrieval_date}, from ` });
  }

  runs.push({ text: ref.url });

  return runs;
}

function formatConferencePresentation(ref: ConferencePresentationRef): Run[] {
  const runs: Run[] = [];

  runs.push(...formatAuthorList(ref));
  runs.push({ text: ` (${ref.year}). ` });
  runs.push({ text: toSentenceCase(ref.title) });
  runs.push({ text: `. ` });

  runs.push({ text: ref.conference });
  if (ref.location) {
    runs.push({ text: `, ${ref.location}` });
  }
  runs.push({ text: `. ` });

  if (ref.url) {
    runs.push({ text: ref.url });
  }

  return runs;
}

function formatDissertation(ref: DissertationRef): Run[] {
  const runs: Run[] = [];

  runs.push(...formatAuthorList(ref));
  runs.push({ text: ` (${ref.year}). ` });
  runs.push({ text: ref.title, italic: true });
  runs.push({ text: ` [Doctoral dissertation, ${ref.institution}]` });

  if (ref.database && ref.database_id) {
    runs.push({ text: `. ${ref.database}` });
    runs.push({ text: ` (${ref.database_id})` });
  }

  runs.push({ text: "." });

  if (ref.url) {
    runs.push({ text: ` ${ref.url}` });
  }

  return runs;
}

function formatTechnicalReport(ref: TechnicalReportRef): Run[] {
  const runs: Run[] = [];

  runs.push(...formatAuthorList(ref));
  runs.push({ text: ` (${ref.year}). ` });
  runs.push({ text: ref.title, italic: true });

  if (ref.report_number) {
    runs.push({ text: ` (Report No. ${ref.report_number})` });
  }

  runs.push({ text: `. ${ref.publisher}.` });

  if (ref.url) {
    runs.push({ text: ` ${ref.url}` });
  }

  return runs;
}

function toSentenceCase(title: string): string {
  // APA sentence case: capitalize first word, first word after colon, proper nouns
  // We only handle the first-word and colon rules; proper nouns must be capitalized by the user
  const result = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();

  // Capitalize first word after colon
  return result.replace(
    /: ([a-z])/g,
    (_match: string, letter: string) => `: ${letter.toUpperCase()}`,
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function processBlockChildren(
  node: { children: RootContent[] },
  references: Record<string, ReferenceEntry>,
): BodyElement[] {
  const elements: BodyElement[] = [];

  for (const child of node.children) {
    if (child.type === "paragraph") {
      const runs = processInline(child, references);
      elements.push({ type: "paragraph", runs });
    } else if (child.type === "heading") {
      elements.push({
        type: "heading",
        level: mapHeadingLevel(child.depth),
        text: extractText(child),
      });
    } else if (child.type === "blockquote") {
      const children = processBlockChildren(child, references);
      elements.push({ type: "block_quote", children });
    } else if (child.type === "list") {
      const items = child.children.map((li: ListItem) =>
        processBlockChildren(li, references),
      );
      if (child.ordered) {
        elements.push({
          type: "ordered_list",
          start: child.start ?? 1,
          items,
        });
      } else {
        elements.push({ type: "bullet_list", items });
      }
    } else if (child.type === "thematicBreak") {
      elements.push({ type: "page_break" });
    }
  }

  return elements;
}
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import YAML from "yaml";
import type { Root } from "mdast";
import type { Frontmatter, ReferenceEntry } from "./types.js";

export interface ParsedDocument {
  frontmatter: Frontmatter;
  mdast: Root;
}

export function parseMarkdown(raw: string): ParsedDocument {
  const frontmatter = extractFrontmatter(raw);
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, "yaml")
    .use(remarkGfm)
    .parse(raw);

  return { frontmatter, mdast: tree };
}

function extractFrontmatter(raw: string): Frontmatter {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error("Document must start with YAML frontmatter (--- delimited)");
  }

  const parsed = YAML.parse(match[1]);

  const fm: Frontmatter = {
    title: parsed.title ?? "",
    author: normalizeToArray(parsed.author),
  };

  if (parsed.affiliation) fm.affiliation = normalizeToArray(parsed.affiliation);
  if (parsed.course) fm.course = String(parsed.course);
  if (parsed.instructor) fm.instructor = String(parsed.instructor);
  if (parsed.date) fm.date = String(parsed.date);
  if (parsed.running_head) fm.running_head = String(parsed.running_head);
  if (parsed.paper_type) fm.paper_type = parsed.paper_type;
  if (parsed.abstract) fm.abstract = String(parsed.abstract);
  if (parsed.keywords) {
    fm.keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.map(String)
      : [String(parsed.keywords)];
  }
  if (parsed.references && typeof parsed.references === "object") {
    fm.references = {};
    for (const [key, value] of Object.entries(parsed.references)) {
      fm.references[key] = value as ReferenceEntry;
    }
  }

  return fm;
}

function normalizeToArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (val === undefined || val === null) return [];
  return [String(val)];
}

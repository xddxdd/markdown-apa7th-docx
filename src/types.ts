// ============================================================
// types.ts — All shared type definitions
// ============================================================

// --- Author representation ---

export type AuthorEntry = string | { organization: string };

// --- Reference types (discriminated union) ---

export type ReferenceType =
  | "journal_article"
  | "book"
  | "edited_book"
  | "book_chapter"
  | "web_page"
  | "conference_presentation"
  | "dissertation"
  | "technical_report";

export interface ReferenceBase {
  type: ReferenceType;
  author: AuthorEntry[];
  year: number | string; // number, "n.d.", or "in press"
  title: string;
  doi?: string;
  url?: string;
}

export interface JournalArticleRef extends ReferenceBase {
  type: "journal_article";
  journal: string;
  volume: number | string;
  issue?: number | string;
  pages: string;
}

export interface BookRef extends ReferenceBase {
  type: "book";
  publisher: string;
  edition?: number;
}

export interface EditedBookRef extends ReferenceBase {
  type: "edited_book";
  publisher: string;
  editor?: AuthorEntry[];
  edition?: number;
}

export interface BookChapterRef extends ReferenceBase {
  type: "book_chapter";
  editor: AuthorEntry[];
  book_title: string;
  publisher: string;
  pages: string;
  edition?: number;
}

export interface WebPageRef extends ReferenceBase {
  type: "web_page";
  website?: string;
  retrieval_date?: string;
  url: string; // required for web pages
}

export interface ConferencePresentationRef extends ReferenceBase {
  type: "conference_presentation";
  conference: string;
  location?: string;
  date?: string;
}

export interface DissertationRef extends ReferenceBase {
  type: "dissertation";
  institution: string;
  database?: string;
  database_id?: string;
}

export interface TechnicalReportRef extends ReferenceBase {
  type: "technical_report";
  report_number?: string;
  publisher: string;
}

export type ReferenceEntry =
  | JournalArticleRef
  | BookRef
  | EditedBookRef
  | BookChapterRef
  | WebPageRef
  | ConferencePresentationRef
  | DissertationRef
  | TechnicalReportRef;

// --- Frontmatter ---

export interface Frontmatter {
  title: string;
  author: string | string[];
  affiliation?: string | string[];
  course?: string;
  instructor?: string;
  date?: string;
  running_head?: string;
  paper_type?: "student" | "professional";
  abstract?: string;
  keywords?: string[];
  references?: Record<string, ReferenceEntry>;
}

// --- APA heading levels ---

export type ApaLevel = 1 | 2 | 3 | 4 | 5;

// --- Semantic Model (intermediate representation) ---

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface HeadingElement {
  type: "heading";
  level: ApaLevel;
  text: string;
}

export interface ParagraphElement {
  type: "paragraph";
  runs: Run[];
}

export interface BlockQuoteElement {
  type: "block_quote";
  children: BodyElement[];
}

export interface BulletListElement {
  type: "bullet_list";
  items: BodyElement[][];
}

export interface OrderedListElement {
  type: "ordered_list";
  start?: number;
  items: BodyElement[][];
}

export type BodyElement =
  | HeadingElement
  | ParagraphElement
  | BlockQuoteElement
  | BulletListElement
  | OrderedListElement;

// --- Citation types ---

export type CitationMode = "narrative" | "parenthetical";

export interface ResolvedCitation {
  key: string;
  mode: CitationMode;
  location?: string; // e.g., "p. 45", "pp. 45-47", "Table 2", "Chapter 3"
}

// --- Formatted reference entry for rendering ---

export interface FormattedReference {
  key: string;
  runs: Run[]; // pre-formatted runs with correct italic/bold
  sortKey: string; // for alphabetical sorting
}

// --- Complete semantic model ---

export interface SemanticModel {
  meta: Frontmatter;
  titlePage: TitlePageContent;
  abstract?: AbstractContent;
  body: BodyElement[];
  references: FormattedReference[];
}

export interface TitlePageContent {
  title: string;
  author: string[];
  affiliation?: string[];
  course?: string;
  instructor?: string;
  date?: string;
  paperType: "student" | "professional";
  runningHead?: string;
}

export interface AbstractContent {
  text: string;
  keywords?: string[];
}

// --- Validation ---

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

# PROJECT KNOWLEDGE BASE

## OVERVIEW

Markdown-to-DOCX converter producing APA 7th edition formatted papers. TypeScript/Node.js pipeline: markdown + YAML frontmatter → mdast AST → SemanticModel → docx.Document.

## STRUCTURE

```
src/
├── cli.ts          # Entry point — file I/O, validation orchestration
├── parse.ts        # unified/remark → mdast + YAML frontmatter
├── validate.ts     # Frontmatter schema, reference, citation validation
├── transform.ts    # mdast → SemanticModel, citation resolution, reference formatting
├── render.ts        # SemanticModel → docx.Document (APA styles)
├── styles.ts       # APA constants (margins, fonts, spacing, indents)
└── types.ts         # All TypeScript interfaces
tests/
└── sample.md       # Example input with full frontmatter + citations
```

## WHERE TO LOOK

| Task | File | Key exports |
|------|------|-------------|
| Add a reference type | `types.ts` + `transform.ts` | Add discriminated union member, add `formatXxx()` function |
| Change APA formatting | `styles.ts` + `render.ts` | Constants in `APA` object, rendering in `renderXxx()` functions |
| Change citation syntax | `transform.ts` | `CITATION_RE` regex, `expandCitations()` |
| Change markdown parsing | `parse.ts` | `parseMarkdown()` — remark plugin chain |
| Change validation rules | `validate.ts` | `validateFrontmatter()`, `validateReferences()`, `validateCitations()` |
| Change title page layout | `render.ts` | `createTitlePageSection()` |
| Change heading styles | `render.ts` | `getHeadingStyle()`, `renderHeading()` |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Frontmatter` | Interface | `types.ts` | YAML frontmatter schema — title, author, references, etc. |
| `ReferenceEntry` | Union | `types.ts` | 8 discriminated reference types (journal_article, book, etc.) |
| `SemanticModel` | Interface | `types.ts` | IR between transform and render — titlePage, body, references |
| `BodyElement` | Union | `types.ts` | heading, paragraph, block_quote, bullet_list, ordered_list, page_break |
| `FormattedReference` | Interface | `types.ts` | Pre-formatted reference with runs + sortKey |
| `Run` | Interface | `types.ts` | Text run with bold/italic flags — rendering primitive |
| `APA` | Const object | `styles.ts` | All APA 7th formatting constants (margins, fonts, spacing in twips) |
| `parseMarkdown()` | Function | `parse.ts` | Raw string → `{ frontmatter, mdast }` |
| `transform()` | Function | `transform.ts` | ParsedDocument → SemanticModel (citation expansion, reference formatting) |
| `validateFrontmatter()` | Function | `validate.ts` | Schema validation — required fields, running head length, abstract words |
| `validateReferences()` | Function | `validate.ts` | Per-type reference validation — required fields for each ref type |
| `validateCitations()` | Function | `validate.ts` | Cross-check cited keys vs defined references |
| `renderToDocx()` | Function | `render.ts` | SemanticModel → Buffer (async) |

## CONVENTIONS

- **Pipeline order**: parse → validate → transform → render. Each stage is a pure function.
- **APA constants**: All in `APA` object in `styles.ts`. Values in twips (1 inch = 1440 twips) or half-points (12pt = 24). Never hardcoded elsewhere.
- **Reference types**: Discriminated union on `type` field. Each type has its own `formatXxx()` function in `transform.ts`.
- **Citation syntax**: `@key` (narrative), `[@key]` (parenthetical), `[@key1; @key2]` (multiple), `@key[p. 45]` (with locator).
- **Headings**: Markdown levels map 1:1 to APA levels (H1→L1 centered, H2→L2 flush-left, etc.). The paper title comes from frontmatter only — do NOT include `# Title` in the markdown body.
- **References section**: Auto-generated from `references:` in frontmatter. Do NOT write `## References` in the markdown body.
- **Page breaks**: Use `---` (thematic break) in markdown to create a page break in the DOCX output.
- **Sentence case**: `toSentenceCase()` in `transform.ts` converts article titles to sentence case. Journal/book titles keep their original casing.

## ANTI-PATTERNS (THIS PROJECT)

- **Do NOT** add `as any` type casts — use proper discriminated union narrowing via `getAuthorName()` helper.
- **Do NOT** hardcode APA values in `render.ts` — use the `APA` constants from `styles.ts`.
- **Do NOT** add heading level offsets — headings map 1:1 from markdown to APA levels.
- **Do NOT** render a `# References` heading in the markdown body — it's auto-generated.
- **Do NOT** include the paper title as an H1 in the markdown body — it comes from frontmatter.
- **Do NOT** use `AlignmentType.JUSTIFIED` — APA specifies left-aligned (ragged right).
- **Do NOT** add extra spacing between paragraphs — APA requires `before: 0, after: 0`.

## UNIQUE STYLES

- **Reference formatting rules** are complex per type (journal article italicizes journal name + volume, book italicizes title, etc.). See `formatJournalArticle()`, `formatBook()`, etc. in `transform.ts`.
- **Author formatting** differs between citation (narrative: "and", parenthetical: "&", 3+ authors: "et al.") and reference list (list all up to 20, use "&" before last).
- **Student vs professional papers** have different title pages (student: course/instructor/date, no running head; professional: running head, different first page header).

## COMMANDS

```bash
npm run cli -- input.md output.docx   # Convert markdown to DOCX
npm run build                          # Compile TypeScript
npm run lint                           # Type-check without emit
npm run test                           # Run vitest
```

## NOTES

- `docx` npm package uses half-points for font size (12pt = `size: 24`) and twips for spacing (double-space = `line: 480`).
- `remark-frontmatter` extracts YAML as a `"yaml"` node — we parse it separately via the `yaml` package, not through the remark AST.
- The `visit()` function from `unist-util-visit` walks the mdast tree. Use `(node: any)` typing — mdast types are complex and not worth the overhead.
- Section breaks in DOCX are implemented as separate `ISectionOptions` objects (title page, body). References get a `PageBreak` run before the heading.
- Page numbering requires `PageNumber.CURRENT` passed as a child of `TextRun`, not standalone.
- Running headers use a right-aligned tab stop at `TabStopPosition.MAX` with `Tab()` between running head text and page number.
- Thematic breaks (`---`) in markdown are converted to page breaks in the DOCX output via `PageBreakElement` in the semantic model.
---
name: apa7th-paper-outline
description: Create APA 7th edition paper outlines in the markdown format consumed by the md2apa converter. Use this skill whenever the user wants to write an APA-formatted paper, create a research paper outline, draft a psychology/sociology/education paper, format citations in APA style, or generate any academic document that needs APA 7th formatting — even if they don't explicitly mention "APA" or "outline." Also use when a user asks how to structure or format a paper for this project.
---

# APA 7th Paper Outline

Generate a markdown file that the `md2apa` converter turns into a properly formatted APA 7th edition DOCX. The markdown file has two parts: YAML frontmatter (metadata, references) and body text (prose only — no title heading, no References section).

## Frontmatter

Begin the file with YAML frontmatter between `---` delimiters. This contains all metadata and reference data — nothing that belongs in frontmatter should appear in the markdown body.

### Required Fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Paper title. Rendered centered and bold on title page and first body page automatically. |
| `author` | string or string[] | `"Jane Doe"` or `["Jane Doe", "John Smith"]` |

### Optional Fields

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `paper_type` | `"student"` or `"professional"` | `"student"` | Student papers show course/instructor/date on title page. Professional papers show running head. |
| `affiliation` | string or string[] | — | Institutional affiliation(s). |
| `course` | string | — | Student papers only. |
| `instructor` | string | — | Student papers only. |
| `date` | string | — | Student papers only. |
| `running_head` | string | — | Professional papers only. ALL CAPS, ≤50 characters. Auto-converted to uppercase. |
| `abstract` | string (YAML block `|`) | — | ≤250 words. Rendered on its own page after title page. Omit entirely to skip the abstract page. |
| `keywords` | string[] | — | Rendered with italic "Keywords:" label after abstract. |
| `references` | mapping | — | Key-value map of citation entries. See Reference Types below. |

### Reference Types

Each entry under `references` is a key-value pair. The key is the citation identifier used in body text (e.g., `smith2023` → `@smith2023`). Every entry requires `type`, `author`, `year`, and `title`.

**`journal_article`**
```yaml
key:
  type: journal_article
  author: [Smith, J., Jones, A. R.]
  year: 2023
  title: Effects of sleep deprivation on cognitive performance
  journal: Journal of Sleep Research
  volume: 45
  issue: 3
  pages: 123-145
  doi: 10.1234/x
```

**`book`**
```yaml
key:
  type: book
  author: [Jones, A. R.]
  year: 2024
  title: The science of sleep and cognition
  publisher: Academic Press
  edition: 7
```

**`edited_book`**
```yaml
key:
  type: edited_book
  author: [Smith, J.]
  year: 2023
  title: Handbook of sleep research
  publisher: Academic Press
  editor: [Lee, C.]
  edition: 2
```

**`book_chapter`**
```yaml
key:
  type: book_chapter
  author: [Brown, M.]
  year: 2022
  title: Decision-making under fatigue
  editor: [Smith, J.]
  book_title: Handbook of sleep research
  publisher: Academic Press
  pages: 78-95
  edition: 2
```

**`web_page`**
```yaml
key:
  type: web_page
  author: [Williams, T.]
  year: 2021
  title: Sleep deprivation screening tools
  website: National Sleep Foundation
  url: https://www.sleepfoundation.org/screening-tools
  retrieval_date: "June 1, 2026"
```

**`conference_presentation`**
```yaml
key:
  type: conference_presentation
  author: [Lee, C.]
  year: 2023
  title: Sleep and cognition
  conference: Annual Meeting of the APA
  location: Washington, DC
  date: "June 15, 2023"
```

**`dissertation`**
```yaml
key:
  type: dissertation
  author: [Davis, K. L.]
  year: 2022
  title: Cognitive effects of sleep loss
  institution: University of California, Berkeley
  database: ProQuest Dissertations Publishing
  database_id: "12345678"
```

**`technical_report`**
```yaml
key:
  type: technical_report
  author: [National Sleep Foundation]
  year: 2021
  title: Sleep deprivation statistics
  publisher: National Sleep Foundation
  report_number: "NSF-2021-04"
  url: https://example.com/report
```

### Author Format

- Personal names: `"Last, F. M."` (e.g., `"Smith, J."`)
- Organizations: `{ organization: "American Psychological Association" }`
- Citations auto-format: 1 author → `Smith (2023)`, 2 → `Smith and Jones (2023)` (narrative) / `Smith & Jones (2023)` (parenthetical), 3+ → `Smith et al. (2023)`
- Reference list: all authors listed up to 20, then ellipsis + last

## Body Conventions

### Do NOT Include in the Body

These are auto-generated from frontmatter. Including them in the markdown body causes duplicates:

- **No `# Paper Title`** — the title comes from frontmatter `title` and is rendered on the title page and first body page automatically
- **No `# References` or `## References`** — the References section is auto-generated from frontmatter `references` on a new page

### Heading Levels

Markdown headings map 1:1 to APA levels:

| Markdown | APA Level | Formatting |
|----------|-----------|------------|
| `#` | Level 1 | Centered, Bold, Title Case |
| `##` | Level 2 | Flush Left, Bold, Title Case |
| `###` | Level 3 | Flush Left, Bold Italic, Title Case |
| `####` | Level 4 | Indented, Bold, Title Case, Period, Run-in |
| `#####` | Level 5 | Indented, Bold Italic, Title Case, Period, Run-in |

Use Level 1 for major sections (`# Method`, `# Results`, `# Discussion`) and Level 2 for subsections (`## Participants`, `## Procedure`).

### Citations

| Syntax | Output | When to use |
|--------|--------|-------------|
| `@smith2023` | Smith (2023) | Narrative — author name flows into sentence |
| `[@smith2023]` | (Smith, 2023) | Parenthetical — enclosed in parentheses |
| `[@key1; @key2]` | (Brown, 2022; Smith, 2023) | Multiple — sorted alphabetically, semicolons |
| `@key[p. 45]` | Smith (2023, p. 45) | Narrative with page locator |
| `[@key1; @key2][pp. 45-47]` | (Brown, 2022; Smith, 2023, pp. 45-47) | Multiple with shared locator |
| `@key[Table 2]` | Smith (2023, Table 2) | Narrative with named locator |

Citation keys must match a key in frontmatter `references`. Undefined keys cause a validation error.

### Other Body Elements

- **Paragraphs**: separated by blank lines. Auto-indented 0.5" with double spacing.
- **Block quotes** (`>`): for 40+ word quotations. Rendered left-indented 0.5", no quotation marks.
- **Bullet lists** (`-`): standard markdown bullet lists.
- **Numbered lists** (`1.`): standard markdown ordered lists.
- **Page breaks** (`---`): thematic break creates a page break in the DOCX output. Use to start new sections on fresh pages.
- **Bold** (`**text**`), **italic** (`*text*`), **inline code** (`` `code` ``) map to DOCX runs.
- **Links** (`[text](url)`): render as `text (url)` — APA does not use hyperlinks.

## Complete Template

```markdown
---
title: "Your Paper Title Here"
author: "Your Name"
affiliation: "Your Institution"
course: "COURSE 101: Course Name"
instructor: "Dr. Instructor Name"
date: "Month Day, Year"
paper_type: "student"
abstract: |
  One paragraph summary of the paper, 250 words or fewer.
keywords: [keyword1, keyword2, keyword3]
references:
  keyyear:
    type: journal_article
    author: [Author, A. B.]
    year: 2026
    title: Article title in sentence case
    journal: Journal Name in Title Case
    volume: 1
    pages: 1-10
    doi: 10.0000/example
---

Introductory paragraph establishing the problem (@keyyear).

# Method

## Participants

Description of participant recruitment and demographics.

## Procedure

Step-by-step description of the experimental procedure (@keyyear[pp. 45-47]).

> Direct quotation of 40 or more words is formatted as a block quote
> in APA style, indented from the left margin.

# Results

Statistical findings and effect sizes [@key1; @key2].

# Discussion

Interpretation of results and implications for future research.
```

## Validation

The converter validates before rendering:
- **Error**: missing `title` or `author`, `running_head` >50 chars, citation key `@key` with no matching reference entry
- **Warning**: reference defined but never cited, abstract >250 words, `running_head` not ALL CAPS (auto-converts)
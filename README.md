# markdown-apa7th-docx

Convert Markdown documents with YAML frontmatter into APA 7th edition formatted DOCX files.

> This project is created with AI assistance. All code have been reviewed by human.

## Install

```bash
npm install
npm run build
```

## Usage

```bash
npm run cli -- input.md output.docx
```

Or after installing globally:

```bash
md2apa input.md output.docx
```

### Input Format

Write your paper in Markdown with a YAML frontmatter header:

```markdown
---
title: "Effects of Sleep Deprivation on Cognitive Performance"
author: "Jane Doe"
affiliation: "University of California, Berkeley"
course: "PSY 301"
instructor: "Dr. Robert Williams"
date: "May 3, 2026"
running_head: "SLEEP DEPRIVATION AND COGNITION"
paper_type: student
abstract: |
  This study examined the effects of sleep deprivation...
keywords: [sleep deprivation, cognitive performance, attention]
references:
  smith2023:
    type: journal_article
    author: [Smith, J., Jones, A. R.]
    year: 2023
    title: Effects of sleep deprivation on cognitive performance
    journal: Journal of Sleep Research
    volume: 45
    issue: 3
    pages: 123-145
    doi: 10.1234/jsr.2023.045
---

## Introduction

Sleep deprivation affects cognitive performance @smith2023.

Previous research [@smith2023; @jones2024] has demonstrated...
```

### Citations

| Syntax | Meaning |
|--------|---------|
| `@key` | Narrative citation |
| `[@key]` | Parenthetical citation |
| `[@key1; @key2]` | Multiple parenthetical citations |
| `@key[p. 45]` | Narrative with locator |
| `[@key][pp. 45-47]` | Parenthetical with locator |

### Reference Types

`journal_article`, `book`, `edited_book`, `book_chapter`, `web_page`, `conference_presentation`, `dissertation`, `technical_report`

### Paper Types

Set `paper_type` to `student` (default) or `professional` in frontmatter. Student papers include course, instructor, and date; professional papers include a running head.

## Development

```bash
npm run build          # Compile TypeScript
npm run lint           # Type-check + ESLint
npm run format         # Format with Prettier
npm run format:check   # Check formatting
npm run test           # Run tests
```

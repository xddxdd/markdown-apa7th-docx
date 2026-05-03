import type {
  ReferenceEntry,
  ValidationError,
  ValidationWarning,
  ValidationResult,
} from "./types.js";

export function validateFrontmatter(fm: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!fm || typeof fm !== "object") {
    errors.push({ path: "", message: "Frontmatter is missing or invalid" });
    return { errors, warnings };
  }

  const f = fm as Record<string, unknown>;

  if (!f.title || typeof f.title !== "string") {
    errors.push({
      path: "title",
      message: 'Required field "title" must be a non-empty string',
    });
  }

  if (!f.author) {
    errors.push({
      path: "author",
      message: 'Required field "author" is missing',
    });
  } else if (
    typeof f.author !== "string" &&
    !(Array.isArray(f.author) && f.author.every((a) => typeof a === "string"))
  ) {
    errors.push({
      path: "author",
      message: '"author" must be a string or array of strings',
    });
  }

  if (f.running_head && typeof f.running_head === "string") {
    if (f.running_head.length > 50) {
      errors.push({
        path: "running_head",
        message: `Running head must be ≤50 characters, got ${f.running_head.length}`,
      });
    }
    if (f.running_head !== f.running_head.toUpperCase()) {
      warnings.push({
        path: "running_head",
        message: "APA 7th requires running head in ALL CAPS; converting automatically",
      });
    }
  }

  if (f.paper_type && f.paper_type !== "student" && f.paper_type !== "professional") {
    errors.push({
      path: "paper_type",
      message: '"paper_type" must be "student" or "professional"',
    });
  }

  if (f.abstract && typeof f.abstract === "string") {
    const wordCount = f.abstract.split(/\s+/).filter(Boolean).length;
    if (wordCount > 250) {
      warnings.push({
        path: "abstract",
        message: `Abstract is ${wordCount} words; APA 7th recommends ≤250 words`,
      });
    }
  }

  if (f.keywords && !Array.isArray(f.keywords)) {
    errors.push({
      path: "keywords",
      message: '"keywords" must be an array of strings',
    });
  }

  return { errors, warnings };
}

export function validateReferences(
  refs: Record<string, ReferenceEntry>,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [key, ref] of Object.entries(refs)) {
    const prefix = `references.${key}`;

    if (!ref.type) {
      errors.push({
        path: `${prefix}.type`,
        message: `Reference "${key}" is missing required field "type"`,
      });
      continue;
    }

    const validTypes: string[] = [
      "journal_article",
      "book",
      "edited_book",
      "book_chapter",
      "web_page",
      "conference_presentation",
      "dissertation",
      "technical_report",
    ];
    if (!validTypes.includes(ref.type)) {
      errors.push({
        path: `${prefix}.type`,
        message: `Unknown reference type "${ref.type}"`,
      });
      continue;
    }

    if (!ref.author || !Array.isArray(ref.author) || ref.author.length === 0) {
      errors.push({
        path: `${prefix}.author`,
        message: `Reference "${key}" must have at least one author`,
      });
    }

    if (ref.year === undefined && ref.year !== 0) {
      errors.push({
        path: `${prefix}.year`,
        message: `Reference "${key}" is missing required field "year"`,
      });
    }

    if (!ref.title || typeof ref.title !== "string") {
      errors.push({
        path: `${prefix}.title`,
        message: `Reference "${key}" is missing required field "title"`,
      });
    }

    const r = ref as unknown as Record<string, unknown>;

    if (ref.type === "journal_article") {
      if (!r.journal)
        errors.push({
          path: `${prefix}.journal`,
          message: `Journal article "${key}" is missing "journal"`,
        });
      if (r.volume === undefined)
        errors.push({
          path: `${prefix}.volume`,
          message: `Journal article "${key}" is missing "volume"`,
        });
      if (!r.pages)
        errors.push({
          path: `${prefix}.pages`,
          message: `Journal article "${key}" is missing "pages"`,
        });
    }

    if (ref.type === "book" || ref.type === "edited_book") {
      if (!r.publisher)
        errors.push({
          path: `${prefix}.publisher`,
          message: `Book "${key}" is missing "publisher"`,
        });
    }

    if (ref.type === "book_chapter") {
      if (!r.book_title)
        errors.push({
          path: `${prefix}.book_title`,
          message: `Book chapter "${key}" is missing "book_title"`,
        });
      if (!r.publisher)
        errors.push({
          path: `${prefix}.publisher`,
          message: `Book chapter "${key}" is missing "publisher"`,
        });
      if (!r.pages)
        errors.push({
          path: `${prefix}.pages`,
          message: `Book chapter "${key}" is missing "pages"`,
        });
    }

    if (ref.type === "web_page") {
      if (!r.url)
        errors.push({
          path: `${prefix}.url`,
          message: `Web page "${key}" is missing "url"`,
        });
    }

    if (ref.type === "dissertation") {
      if (!r.institution)
        errors.push({
          path: `${prefix}.institution`,
          message: `Dissertation "${key}" is missing "institution"`,
        });
    }

    if (ref.type === "conference_presentation") {
      if (!r.conference)
        errors.push({
          path: `${prefix}.conference`,
          message: `Conference presentation "${key}" is missing "conference"`,
        });
    }
  }

  return { errors, warnings };
}

export function validateCitations(
  citedKeys: Set<string>,
  definedKeys: Set<string>,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const key of citedKeys) {
    if (!definedKeys.has(key)) {
      errors.push({
        path: `@${key}`,
        message: `Citation @${key} is used but not defined in references`,
      });
    }
  }

  for (const key of definedKeys) {
    if (!citedKeys.has(key)) {
      warnings.push({
        path: `references.${key}`,
        message: `Reference "${key}" is defined but never cited in the document`,
      });
    }
  }

  return { errors, warnings };
}

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const merged: ValidationResult = { errors: [], warnings: [] };
  for (const r of results) {
    merged.errors.push(...r.errors);
    merged.warnings.push(...r.warnings);
  }
  return merged;
}

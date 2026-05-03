#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseMarkdown } from "./parse.js";
import {
  validateFrontmatter,
  validateReferences,
  validateCitations,
  mergeResults,
} from "./validate.js";
import { transform } from "./transform.js";
import { renderToDocx } from "./render.js";
import { collectCitationKeys } from "./transform.js";

export async function main(args: string[]): Promise<void> {
  if (args.length < 1) {
    console.error("Usage: md2apa <input.md> [output.docx]");
    process.exit(1);
  }

  const inputPath = resolve(args[0]);
  const outputPath = args[1]
    ? resolve(args[1])
    : inputPath.replace(/\.(md|markdown|txt)$/i, ".docx");

  let raw: string;
  try {
    raw = readFileSync(inputPath, "utf-8");
  } catch (_err) {
    console.error(`Error: Cannot read file ${inputPath}`);
    process.exit(1);
  }

  const parsed = parseMarkdown(raw);
  const fmErrors = validateFrontmatter(parsed.frontmatter);

  const refs = parsed.frontmatter.references ?? {};
  const refErrors = validateReferences(refs);

  const citeKeys = collectCitationKeys(parsed.mdast);
  const citeErrors = validateCitations(citeKeys, new Set(Object.keys(refs)));

  const result = mergeResults(fmErrors, refErrors, citeErrors);

  if (result.errors.length > 0) {
    console.error("Errors found:");
    for (const err of result.errors) {
      console.error(`  ✗ ${err.path}: ${err.message}`);
    }
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn("Warnings:");
    for (const warn of result.warnings) {
      console.warn(`  ⚠ ${warn.path}: ${warn.message}`);
    }
  }

  const model = transform(parsed);
  const buffer = await renderToDocx(model);

  writeFileSync(outputPath, buffer);
  console.log(`Output written to ${outputPath}`);
}

main(process.argv.slice(2));

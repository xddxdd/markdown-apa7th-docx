import { AlignmentType, convertInchesToTwip } from "docx";

export const APA = {
  MARGIN: convertInchesToTwip(1),
  FONT: "Times New Roman",
  FONT_SIZE: 24, // 12pt in half-points
  LINE_SPACING: 480, // double spacing in twips (240 × 2)
  FIRST_LINE_INDENT: convertInchesToTwip(0.5),
  HANGING_INDENT: convertInchesToTwip(0.5),
  BLOCK_QUOTE_INDENT: convertInchesToTwip(0.5),
  SPACING_BEFORE: 0,
  SPACING_AFTER: 0,
  RUNNING_HEAD_MAX: 50,
  ABSTRACT_MAX_WORDS: 250,
  PAGE_WIDTH_CONTENT: convertInchesToTwip(6.5), // 8.5" - 2" margins
} as const;

export function normalParagraphSpacing(): {
  line: number;
  before: number;
  after: number;
} {
  return {
    line: APA.LINE_SPACING,
    before: APA.SPACING_BEFORE,
    after: APA.SPACING_AFTER,
  };
}

export function headingStyle(level: 1 | 2 | 3 | 4 | 5) {
  switch (level) {
    case 1:
      return {
        alignment: AlignmentType.CENTER,
        spacing: normalParagraphSpacing(),
        run: { bold: true, font: APA.FONT, size: APA.FONT_SIZE },
      };
    case 2:
      return {
        alignment: AlignmentType.LEFT,
        spacing: normalParagraphSpacing(),
        run: { bold: true, font: APA.FONT, size: APA.FONT_SIZE },
      };
    case 3:
      return {
        alignment: AlignmentType.LEFT,
        spacing: normalParagraphSpacing(),
        run: {
          bold: true,
          italics: true,
          font: APA.FONT,
          size: APA.FONT_SIZE,
        },
      };
    case 4:
      return {
        alignment: AlignmentType.LEFT,
        spacing: normalParagraphSpacing(),
        indent: { firstLine: APA.FIRST_LINE_INDENT },
        run: { bold: true, font: APA.FONT, size: APA.FONT_SIZE },
      };
    case 5:
      return {
        alignment: AlignmentType.LEFT,
        spacing: normalParagraphSpacing(),
        indent: { firstLine: APA.FIRST_LINE_INDENT },
        run: {
          bold: true,
          italics: true,
          font: APA.FONT,
          size: APA.FONT_SIZE,
        },
      };
  }
}

export function referenceParagraphStyle(): {
  spacing: { line: number; before: number; after: number };
  indent: { left: number; hanging: number };
} {
  return {
    spacing: normalParagraphSpacing(),
    indent: {
      left: APA.HANGING_INDENT,
      hanging: APA.HANGING_INDENT,
    },
  };
}

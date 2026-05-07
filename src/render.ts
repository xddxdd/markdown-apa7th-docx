import {
  Document,
  Paragraph,
  TextRun,
  Header,
  Tab,
  PageNumber,
  AlignmentType,
  SectionType,
  TabStopType,
  TabStopPosition,
  Packer,
  PageBreak,
} from "docx";
import type { ISectionOptions } from "docx";
import type {
  SemanticModel,
  AbstractContent,
  BodyElement,
  HeadingElement,
  ParagraphElement,
  BlockQuoteElement,
  BulletListElement,
  OrderedListElement,
  Run,
  FormattedReference,
} from "./types.js";
import { APA, normalParagraphSpacing, referenceParagraphStyle } from "./styles.js";

export async function renderToDocx(model: SemanticModel): Promise<Buffer> {
  const doc = createDocument(model);
  return Packer.toBuffer(doc);
}

function createDocument(model: SemanticModel): Document {
  const isProfessional = model.titlePage.paperType === "professional";
  const titlePageSection = createTitlePageSection(model, isProfessional);
  const bodySection = createBodySection(model, isProfessional);

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: APA.FONT, size: APA.FONT_SIZE },
          paragraph: { spacing: normalParagraphSpacing() },
        },
      },
    },
    sections: [titlePageSection, bodySection],
  });
}

function createTitlePageHeader(isProfessional: boolean, runningHead?: string): Header {
  if (isProfessional && runningHead) {
    return new Header({
      children: [
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { after: 0, before: 0, line: APA.LINE_SPACING },
          children: [
            new TextRun({ text: runningHead, font: APA.FONT, size: APA.FONT_SIZE }),
            new Tab(),
            new TextRun({
              children: [PageNumber.CURRENT],
              font: APA.FONT,
              size: APA.FONT_SIZE,
            }),
          ],
        }),
      ],
    });
  }

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0, before: 0, line: APA.LINE_SPACING },
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: APA.FONT,
            size: APA.FONT_SIZE,
          }),
        ],
      }),
    ],
  });
}

function createTitlePageSection(
  model: SemanticModel,
  isProfessional: boolean,
): ISectionOptions {
  const tp = model.titlePage;
  const children: Paragraph[] = [];

  // APA: title page content vertically centered — ~7 empty double-spaced lines
  for (let i = 0; i < 7; i++) {
    children.push(new Paragraph({ spacing: normalParagraphSpacing(), children: [] }));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: normalParagraphSpacing(),
      children: [
        new TextRun({ text: tp.title, bold: true, font: APA.FONT, size: APA.FONT_SIZE }),
      ],
    }),
  );

  for (const author of tp.author) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: normalParagraphSpacing(),
        children: [new TextRun({ text: author, font: APA.FONT, size: APA.FONT_SIZE })],
      }),
    );
  }

  if (tp.affiliation) {
    for (const aff of tp.affiliation) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: normalParagraphSpacing(),
          children: [new TextRun({ text: aff, font: APA.FONT, size: APA.FONT_SIZE })],
        }),
      );
    }
  }

  if (!isProfessional) {
    if (tp.course) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: normalParagraphSpacing(),
          children: [
            new TextRun({ text: tp.course, font: APA.FONT, size: APA.FONT_SIZE }),
          ],
        }),
      );
    }
    if (tp.instructor) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: normalParagraphSpacing(),
          children: [
            new TextRun({ text: tp.instructor, font: APA.FONT, size: APA.FONT_SIZE }),
          ],
        }),
      );
    }
    if (tp.date) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: normalParagraphSpacing(),
          children: [new TextRun({ text: tp.date, font: APA.FONT, size: APA.FONT_SIZE })],
        }),
      );
    }
  }

  // APA: professional papers may include author note in bottom half of title page

  if (model.abstract) {
    // APA: abstract on new page
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...createAbstractParagraphs(model.abstract));
  }

  const defaultHeader = createTitlePageHeader(isProfessional, tp.runningHead);

  const sectionConfig: ISectionOptions = {
    properties: {
      page: {
        margin: {
          top: APA.MARGIN,
          bottom: APA.MARGIN,
          left: APA.MARGIN,
          right: APA.MARGIN,
        },
        pageNumbers: { start: 1 },
      },
      ...(isProfessional ? { titlePage: true } : {}),
    },
    headers: {
      default: defaultHeader,
      ...(isProfessional
        ? {
            first: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 0, before: 0, line: APA.LINE_SPACING },
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: APA.FONT,
                      size: APA.FONT_SIZE,
                    }),
                  ],
                }),
              ],
            }),
          }
        : {}),
    },
    children,
  };

  return sectionConfig;
}

function createAbstractParagraphs(abstract: AbstractContent): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: normalParagraphSpacing(),
      children: [
        new TextRun({
          text: "Abstract",
          bold: true,
          font: APA.FONT,
          size: APA.FONT_SIZE,
        }),
      ],
    }),
  );

  paragraphs.push(
    new Paragraph({
      spacing: normalParagraphSpacing(),
      children: [
        new TextRun({ text: abstract.text, font: APA.FONT, size: APA.FONT_SIZE }),
      ],
    }),
  );

  if (abstract.keywords && abstract.keywords.length > 0) {
    paragraphs.push(
      new Paragraph({
        spacing: normalParagraphSpacing(),
        indent: { firstLine: APA.FIRST_LINE_INDENT },
        children: [
          new TextRun({
            text: "Keywords: ",
            italics: true,
            font: APA.FONT,
            size: APA.FONT_SIZE,
          }),
          new TextRun({
            text: abstract.keywords.join(", "),
            font: APA.FONT,
            size: APA.FONT_SIZE,
          }),
        ],
      }),
    );
  }

  return paragraphs;
}

function createBodySection(
  model: SemanticModel,
  isProfessional: boolean,
): ISectionOptions {
  const tp = model.titlePage;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: normalParagraphSpacing(),
      children: [
        new TextRun({ text: tp.title, bold: true, font: APA.FONT, size: APA.FONT_SIZE }),
      ],
    }),
  );

  for (const element of model.body) {
    children.push(...renderBodyElement(element));
  }

  if (model.references.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...renderReferences(model.references));
  }

  const header = createRunningHeader(isProfessional, tp.runningHead);

  return {
    properties: {
      type: SectionType.NEXT_PAGE,
      page: {
        margin: {
          top: APA.MARGIN,
          bottom: APA.MARGIN,
          left: APA.MARGIN,
          right: APA.MARGIN,
        },
      },
    },
    headers: { default: header },
    children,
  };
}

function createRunningHeader(isProfessional: boolean, runningHead?: string): Header {
  if (isProfessional && runningHead) {
    return new Header({
      children: [
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          spacing: { after: 0, before: 0, line: APA.LINE_SPACING },
          children: [
            new TextRun({ text: runningHead, font: APA.FONT, size: APA.FONT_SIZE }),
            new Tab(),
            new TextRun({
              children: [PageNumber.CURRENT],
              font: APA.FONT,
              size: APA.FONT_SIZE,
            }),
          ],
        }),
      ],
    });
  }

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 0, before: 0, line: APA.LINE_SPACING },
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: APA.FONT,
            size: APA.FONT_SIZE,
          }),
        ],
      }),
    ],
  });
}

function renderBodyElement(element: BodyElement): Paragraph[] {
  switch (element.type) {
    case "heading":
      return [renderHeading(element)];
    case "paragraph":
      return [renderParagraph(element)];
    case "block_quote":
      return renderBlockQuote(element);
    case "bullet_list":
      return renderBulletList(element);
    case "ordered_list":
      return renderOrderedList(element);
    case "page_break":
      return [new Paragraph({ children: [new PageBreak()] })];
  }
}

function renderHeading(element: HeadingElement): Paragraph {
  const style = getHeadingStyle(element.level);

  // APA Level 4/5: indented, bold, ends with period, run-in heading
  if (element.level === 4 || element.level === 5) {
    return new Paragraph({
      alignment: style.alignment,
      spacing: style.spacing,
      indent: style.indent,
      children: [
        new TextRun({
          text: element.text.endsWith(".") ? element.text : element.text + ".",
          bold: style.run.bold,
          italics: style.run.italics,
          font: APA.FONT,
          size: APA.FONT_SIZE,
        }),
      ],
    });
  }

  return new Paragraph({
    alignment: style.alignment,
    spacing: style.spacing,
    children: [
      new TextRun({
        text: element.text,
        bold: style.run.bold,
        italics: style.run.italics,
        font: APA.FONT,
        size: APA.FONT_SIZE,
      }),
    ],
  });
}

function getHeadingStyle(level: 1 | 2 | 3 | 4 | 5) {
  return {
    1: {
      alignment: AlignmentType.CENTER,
      spacing: normalParagraphSpacing(),
      indent: undefined,
      run: { bold: true, italics: false },
    },
    2: {
      alignment: AlignmentType.LEFT,
      spacing: normalParagraphSpacing(),
      indent: undefined,
      run: { bold: true, italics: false },
    },
    3: {
      alignment: AlignmentType.LEFT,
      spacing: normalParagraphSpacing(),
      indent: undefined,
      run: { bold: true, italics: true },
    },
    4: {
      alignment: AlignmentType.LEFT,
      spacing: normalParagraphSpacing(),
      indent: { firstLine: APA.FIRST_LINE_INDENT },
      run: { bold: true, italics: false },
    },
    5: {
      alignment: AlignmentType.LEFT,
      spacing: normalParagraphSpacing(),
      indent: { firstLine: APA.FIRST_LINE_INDENT },
      run: { bold: true, italics: true },
    },
  }[level];
}

function renderParagraph(element: ParagraphElement): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: normalParagraphSpacing(),
    indent: { firstLine: APA.FIRST_LINE_INDENT },
    children: element.runs.map((r) => runToTextRun(r)),
  });
}

function renderBlockQuote(element: BlockQuoteElement): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const child of element.children) {
    if (child.type === "paragraph") {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: normalParagraphSpacing(),
          indent: { left: APA.BLOCK_QUOTE_INDENT },
          children: child.runs.map((r) => runToTextRun(r)),
        }),
      );
    }
  }
  return paragraphs;
}

function renderBulletList(element: BulletListElement): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const item of element.items) {
    const runs: TextRun[] = [];
    runs.push(new TextRun({ text: "• ", font: APA.FONT, size: APA.FONT_SIZE }));
    for (const child of item) {
      if (child.type === "paragraph") {
        runs.push(...child.runs.map((r) => runToTextRun(r)));
      }
    }
    paragraphs.push(
      new Paragraph({
        spacing: normalParagraphSpacing(),
        indent: { left: APA.FIRST_LINE_INDENT },
        children: runs,
      }),
    );
  }
  return paragraphs;
}

function renderOrderedList(element: OrderedListElement): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const start = element.start ?? 1;
  for (let i = 0; i < element.items.length; i++) {
    const item = element.items[i];
    const runs: TextRun[] = [];
    runs.push(
      new TextRun({ text: `${start + i}. `, font: APA.FONT, size: APA.FONT_SIZE }),
    );
    for (const child of item) {
      if (child.type === "paragraph") {
        runs.push(...child.runs.map((r) => runToTextRun(r)));
      }
    }
    paragraphs.push(
      new Paragraph({
        spacing: normalParagraphSpacing(),
        indent: { left: APA.FIRST_LINE_INDENT },
        children: runs,
      }),
    );
  }
  return paragraphs;
}

function renderReferences(references: FormattedReference[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: normalParagraphSpacing(),
      children: [
        new TextRun({
          text: "References",
          bold: true,
          font: APA.FONT,
          size: APA.FONT_SIZE,
        }),
      ],
    }),
  );

  const refStyle = referenceParagraphStyle();
  for (const ref of references) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: refStyle.spacing,
        indent: refStyle.indent,
        children: ref.runs.map((r) => runToTextRun(r)),
      }),
    );
  }

  return paragraphs;
}

function runToTextRun(run: Run): TextRun {
  return new TextRun({
    text: run.text,
    bold: run.bold,
    italics: run.italic,
    font: APA.FONT,
    size: APA.FONT_SIZE,
  });
}
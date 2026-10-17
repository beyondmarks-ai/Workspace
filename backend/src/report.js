import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

export async function createValidationReport({ prompt, originalName, jobId }) {
  const document = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
        }
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun({ text: 'Beyond Marks Workspace', bold: true, color: '9A641C' })]
        }),
        new Paragraph({
          children: [new TextRun({ text: 'Backend validation report', bold: true, size: 28 })],
          spacing: { before: 360, after: 240 }
        }),
        new Paragraph({ children: [new TextRun({ text: `Reference file: ${originalName}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Job ID: ${jobId}` })] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          text: 'Instructions',
          spacing: { before: 360, after: 120 }
        }),
        new Paragraph({ text: prompt || 'Recreate the uploaded reference document.' }),
        new Paragraph({
          spacing: { before: 480 },
          children: [new TextRun({
            text: 'The upload, storage, processing and download pipeline is working. Codex document generation will replace this validation processor once API skill access is configured.',
            italics: true,
            color: '666666'
          })]
        })
      ]
    }]
  });

  return Packer.toBuffer(document);
}

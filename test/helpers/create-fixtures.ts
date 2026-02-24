import JSZip from 'jszip';

/**
 * Create a minimal valid PDF buffer with text content.
 * This generates a bare-bones PDF 1.4 structure.
 */
export function createPdfBuffer(text: string, pages: number = 1): Buffer {
  const pageTexts = text.split('\n\n').filter((t) => t.trim());
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // Object 2: Pages
  const pageRefs = Array.from({ length: pages }, (_, i) => `${i + 4} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${pages} >>\nendobj`);

  // Object 3: Font
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  );

  let objNum = 4;
  for (let i = 0; i < pages; i++) {
    const contentObj = objNum + 1;
    const pageText = pageTexts[i] || text;
    const stream = `BT /F1 12 Tf 72 720 Td (${pageText.replace(/[()\\]/g, '\\$&')}) Tj ET`;
    // Page object
    objects.push(
      `${objNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObj} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj`,
    );
    // Content stream
    objects.push(
      `${contentObj} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
    );
    objNum += 2;
  }

  const body = objects.join('\n');
  const xrefOffset = `%PDF-1.4\n`.length + body.length + 1;
  const pdf = `%PDF-1.4\n${body}\nxref\n0 ${objNum}\ntrailer\n<< /Size ${objNum} /Root 1 0 R /Info << /Title (Test PDF) /Author (Test Author) >> >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
}

/**
 * Create a minimal valid EPUB buffer.
 */
export async function createEpubBuffer(options: {
  title?: string;
  author?: string;
  chapters: { title: string; body: string }[];
}): Promise<Buffer> {
  const { title = 'Test Book', author = 'Test Author', chapters } = options;
  const zip = new JSZip();

  // mimetype (must be first, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  // Build manifest and spine
  const manifestItems = chapters
    .map((_, i) => `<item id="ch${i}" href="chapter${i}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n    ');
  const spineItems = chapters.map((_, i) => `<itemref idref="ch${i}"/>`).join('\n    ');

  // content.opf
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine>
    ${spineItems}
  </spine>
</package>`,
  );

  // Chapter XHTML files
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    zip.file(
      `OEBPS/chapter${i}.xhtml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${ch.title}</title></head>
<body>
  <h1>${ch.title}</h1>
  ${ch.body}
</body>
</html>`,
    );
  }

  const arrayBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return Buffer.from(arrayBuffer);
}

/**
 * Create a "scanned" PDF (no real text content).
 */
export function createScannedPdfBuffer(): Buffer {
  // Minimal PDF with empty page (no text stream)
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
trailer
<< /Size 4 /Root 1 0 R >>
startxref
0
%%EOF`;
  return Buffer.from(pdf);
}

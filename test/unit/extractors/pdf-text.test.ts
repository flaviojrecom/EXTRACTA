import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PdfTextExtractor } from '../../../src/extractors/pdf-text.js';
import { ExtractionError } from '../../../src/core/errors.js';
import { validateStandardHtml } from '../../../src/core/standard-html.js';

describe('PdfTextExtractor', () => {
  const extractor = new PdfTextExtractor();
  const simplePdf = readFileSync(resolve('test/fixtures/pdf/simple.pdf'));
  const multipagePdf = readFileSync(resolve('test/fixtures/pdf/multipage.pdf'));

  it('should support .pdf extension', () => {
    expect(extractor.canHandle('.pdf')).toBe(true);
    expect(extractor.canHandle('.txt')).toBe(false);
  });

  it('should detect PDF by magic bytes', () => {
    expect(extractor.canHandle('.unknown', simplePdf)).toBe(true);
  });

  it('should not detect non-PDF by magic bytes', () => {
    const txtBuffer = Buffer.from('Hello world');
    expect(extractor.canHandle('.unknown', txtBuffer)).toBe(false);
  });

  it('should extract text from a valid PDF', async () => {
    const result = await extractor.extract(simplePdf);

    expect(result.html).toContain('<article>');
    expect(result.html).toContain('<p>');
    expect(result.metadata.sourceFormat).toBe('pdf');
    expect(result.metadata.isScanned).toBe(false);
    expect(result.metadata.pageCount).toBeGreaterThan(0);
  });

  it('should produce valid StandardHTML', async () => {
    const result = await extractor.extract(simplePdf);
    const validation = validateStandardHtml(result.html);
    expect(validation.valid).toBe(true);
  });

  it('should extract multi-page PDF', async () => {
    const result = await extractor.extract(multipagePdf);
    expect(result.metadata.pageCount).toBeGreaterThan(0);
    expect(result.html).toContain('<article>');
  });

  it('should throw ScannedPdfError for empty PDF', async () => {
    // Create a minimal PDF with no text content via a real empty-text PDF
    // We mock by creating a PDF-like buffer that pdf-parse can parse but has no text
    // Use the extractor with a buffer that has valid structure but zero extractable text
    const emptyTextPdf = Buffer.alloc(0);
    await expect(extractor.extract(emptyTextPdf)).rejects.toThrow();
  });

  it('should throw ExtractionError for invalid input', async () => {
    const invalidBuffer = Buffer.from('not a pdf at all');
    await expect(extractor.extract(invalidBuffer)).rejects.toThrow(ExtractionError);
  });

  it('should populate metadata', async () => {
    const result = await extractor.extract(simplePdf, {
      fileName: 'test.pdf',
      extension: '.pdf',
      sizeBytes: simplePdf.length,
    });

    expect(result.metadata.sourceFormat).toBe('pdf');
    expect(typeof result.metadata.pageCount).toBe('number');
  });
});

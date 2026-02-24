import { ExtractorRegistry } from '../../../src/extractors/registry.js';
import { PdfTextExtractor } from '../../../src/extractors/pdf-text.js';
import { EpubExtractor } from '../../../src/extractors/epub.js';
import { TxtExtractor } from '../../../src/extractors/txt.js';
import { HtmlExtractor } from '../../../src/extractors/html.js';
import { RtfExtractor } from '../../../src/extractors/rtf.js';
import { MobiExtractor } from '../../../src/extractors/mobi.js';
import { UnsupportedFormatError } from '../../../src/core/errors.js';

describe('ExtractorRegistry', () => {
  let registry: ExtractorRegistry;

  beforeEach(() => {
    registry = new ExtractorRegistry();
  });

  it('should return PdfTextExtractor for .pdf', () => {
    const extractor = registry.getExtractor('.pdf');
    expect(extractor).toBeInstanceOf(PdfTextExtractor);
  });

  it('should return EpubExtractor for .epub', () => {
    const extractor = registry.getExtractor('.epub');
    expect(extractor).toBeInstanceOf(EpubExtractor);
  });

  it('should return TxtExtractor for .txt', () => {
    const extractor = registry.getExtractor('.txt');
    expect(extractor).toBeInstanceOf(TxtExtractor);
  });

  it('should return TxtExtractor for .text', () => {
    const extractor = registry.getExtractor('.text');
    expect(extractor).toBeInstanceOf(TxtExtractor);
  });

  it('should handle extensions without leading dot', () => {
    const extractor = registry.getExtractor('pdf');
    expect(extractor).toBeInstanceOf(PdfTextExtractor);
  });

  it('should throw UnsupportedFormatError for unknown format', () => {
    expect(() => registry.getExtractor('.docx')).toThrow(UnsupportedFormatError);
  });

  it('should return HtmlExtractor for .html and .htm', () => {
    expect(registry.getExtractor('.html')).toBeInstanceOf(HtmlExtractor);
    expect(registry.getExtractor('.htm')).toBeInstanceOf(HtmlExtractor);
  });

  it('should return RtfExtractor for .rtf', () => {
    expect(registry.getExtractor('.rtf')).toBeInstanceOf(RtfExtractor);
  });

  it('should return MobiExtractor for .mobi, .azw, .azw3', () => {
    expect(registry.getExtractor('.mobi')).toBeInstanceOf(MobiExtractor);
    expect(registry.getExtractor('.azw')).toBeInstanceOf(MobiExtractor);
    expect(registry.getExtractor('.azw3')).toBeInstanceOf(MobiExtractor);
  });

  it('should list supported formats', () => {
    const formats = registry.getSupportedFormats();
    expect(formats).toContain('.pdf');
    expect(formats).toContain('.epub');
    expect(formats).toContain('.txt');
    expect(formats).toContain('.text');
    expect(formats).toContain('.html');
    expect(formats).toContain('.htm');
    expect(formats).toContain('.rtf');
    expect(formats).toContain('.mobi');
    expect(formats).toContain('.azw');
    expect(formats).toContain('.azw3');
  });

  it('should fallback to magic bytes detection', () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 content');
    const extractor = registry.getExtractor('.unknown', pdfBuffer);
    expect(extractor).toBeInstanceOf(PdfTextExtractor);
  });

  it('should allow registering custom extractors', () => {
    const custom: any = {
      supportedExtensions: ['.md'],
      canHandle: () => true,
      extract: async () => ({ html: '', metadata: { sourceFormat: 'md' }, warnings: [] }),
    };
    registry.register(custom);
    expect(registry.getExtractor('.md')).toBe(custom);
    expect(registry.getSupportedFormats()).toContain('.md');
  });
});

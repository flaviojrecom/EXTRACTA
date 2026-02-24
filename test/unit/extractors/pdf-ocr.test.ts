import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfOcrExtractor } from '../../../src/extractors/pdf-ocr.js';
import type { OcrProvider, OcrConfig, OcrPageResult, RasterizedPage } from '../../../src/extractors/ocr/types.js';

// Create mock provider
function createMockProvider(pageResults: OcrPageResult[]): OcrProvider {
  let resultIndex = 0;
  return {
    name: 'mock-ocr',
    initialize: vi.fn(),
    recognizePage: vi.fn(async () => {
      const result = pageResults[resultIndex % pageResults.length];
      resultIndex++;
      return result;
    }),
    terminate: vi.fn(),
  };
}

// Mock rasterizer
const mockRasterize = vi.fn<(buf: Buffer, dpi: number) => Promise<RasterizedPage[]>>();
vi.mock('../../../src/extractors/ocr/rasterizer.js', () => ({
  PdfRasterizer: vi.fn(() => ({
    rasterize: mockRasterize,
  })),
}));

describe('PdfOcrExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle .pdf extension', () => {
    const extractor = new PdfOcrExtractor();
    expect(extractor.canHandle('.pdf')).toBe(true);
    expect(extractor.canHandle('.txt')).toBe(false);
  });

  it('should detect PDF magic bytes', () => {
    const extractor = new PdfOcrExtractor();
    const pdfBuffer = Buffer.from('%PDF-1.4');
    expect(extractor.canHandle('.unknown', pdfBuffer)).toBe(true);
  });

  it('should extract text from scanned PDF', async () => {
    const mockPages: RasterizedPage[] = [
      { pageNumber: 1, imageBuffer: Buffer.from('img1'), width: 612, height: 792 },
      { pageNumber: 2, imageBuffer: Buffer.from('img2'), width: 612, height: 792 },
    ];
    mockRasterize.mockResolvedValue(mockPages);

    const mockProvider = createMockProvider([
      { pageNumber: 1, text: 'Page one content', confidence: 85, warnings: [] },
      { pageNumber: 2, text: 'Page two content', confidence: 90, warnings: [] },
    ]);

    const extractor = new PdfOcrExtractor({}, mockProvider);
    const result = await extractor.extract(Buffer.from('fake-pdf'), {
      fileName: 'test.pdf',
      extension: '.pdf',
      sizeBytes: 100,
    });

    expect(result.metadata.isScanned).toBe(true);
    expect(result.metadata.ocrEngine).toBe('mock-ocr');
    expect(result.metadata.ocrConfidence).toBeCloseTo(87.5);
    expect(result.metadata.pageCount).toBe(2);
    expect(result.html).toContain('data-source="ocr"');
    expect(result.html).toContain('data-page="1"');
    expect(result.html).toContain('data-page="2"');
    expect(result.html).toContain('Page one content');
    expect(result.html).toContain('Page two content');
    expect(mockProvider.initialize).toHaveBeenCalled();
    expect(mockProvider.terminate).toHaveBeenCalled();
  });

  it('should handle pages with low confidence', async () => {
    mockRasterize.mockResolvedValue([
      { pageNumber: 1, imageBuffer: Buffer.from('img'), width: 100, height: 100 },
    ]);

    const mockProvider = createMockProvider([
      {
        pageNumber: 1,
        text: 'blurry',
        confidence: 30,
        warnings: ['Page 1 has low OCR confidence (30%, threshold: 60%)'],
      },
    ]);

    const extractor = new PdfOcrExtractor({ confidenceThreshold: 60 }, mockProvider);
    const result = await extractor.extract(Buffer.from('fake'), {
      fileName: 'test.pdf',
      extension: '.pdf',
      sizeBytes: 50,
    });

    expect(result.metadata.lowConfidencePages).toEqual([1]);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('low OCR confidence'))).toBe(true);
  });

  it('should survive individual page failures', async () => {
    mockRasterize.mockResolvedValue([
      { pageNumber: 1, imageBuffer: Buffer.from('img1'), width: 100, height: 100 },
      { pageNumber: 2, imageBuffer: Buffer.from('img2'), width: 100, height: 100 },
    ]);

    let callCount = 0;
    const mockProvider: OcrProvider = {
      name: 'mock-ocr',
      initialize: vi.fn(),
      recognizePage: vi.fn(async (_buf, pageNum) => {
        callCount++;
        if (callCount === 1) throw new Error('Page 1 corrupted');
        return { pageNumber: pageNum, text: 'Page 2 ok', confidence: 80, warnings: [] };
      }),
      terminate: vi.fn(),
    };

    const extractor = new PdfOcrExtractor({}, mockProvider);
    const result = await extractor.extract(Buffer.from('fake'), {
      fileName: 'test.pdf',
      extension: '.pdf',
      sizeBytes: 50,
    });

    expect(result.html).toContain('Page 2 ok');
    expect(result.warnings.some((w) => w.includes('failed'))).toBe(true);
  });

  it('should throw when all pages fail', async () => {
    mockRasterize.mockResolvedValue([
      { pageNumber: 1, imageBuffer: Buffer.from('img'), width: 100, height: 100 },
    ]);

    const mockProvider: OcrProvider = {
      name: 'mock-ocr',
      initialize: vi.fn(),
      recognizePage: vi.fn(async () => {
        throw new Error('OCR engine crash');
      }),
      terminate: vi.fn(),
    };

    const extractor = new PdfOcrExtractor({}, mockProvider);
    await expect(
      extractor.extract(Buffer.from('fake'), {
        fileName: 'test.pdf',
        extension: '.pdf',
        sizeBytes: 50,
      }),
    ).rejects.toThrow('All pages failed OCR');
  });

  it('should throw when PDF has no pages', async () => {
    mockRasterize.mockResolvedValue([]);

    const mockProvider = createMockProvider([]);
    const extractor = new PdfOcrExtractor({}, mockProvider);

    await expect(
      extractor.extract(Buffer.from('fake'), {
        fileName: 'test.pdf',
        extension: '.pdf',
        sizeBytes: 50,
      }),
    ).rejects.toThrow('no pages');
  });

  it('should always terminate provider even on error', async () => {
    mockRasterize.mockRejectedValue(new Error('rasterize failed'));

    const mockProvider = createMockProvider([]);
    const extractor = new PdfOcrExtractor({}, mockProvider);

    await expect(
      extractor.extract(Buffer.from('fake'), {
        fileName: 'test.pdf',
        extension: '.pdf',
        sizeBytes: 50,
      }),
    ).rejects.toThrow();

    expect(mockProvider.terminate).toHaveBeenCalled();
  });

  it('should escape HTML in OCR text', async () => {
    mockRasterize.mockResolvedValue([
      { pageNumber: 1, imageBuffer: Buffer.from('img'), width: 100, height: 100 },
    ]);

    const mockProvider = createMockProvider([
      { pageNumber: 1, text: 'Text with <script>alert("xss")</script>', confidence: 90, warnings: [] },
    ]);

    const extractor = new PdfOcrExtractor({}, mockProvider);
    const result = await extractor.extract(Buffer.from('fake'), {
      fileName: 'test.pdf',
      extension: '.pdf',
      sizeBytes: 50,
    });

    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
  });
});

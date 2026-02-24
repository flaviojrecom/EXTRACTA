import { describe, it, expect, vi } from 'vitest';
import { ExtractorRegistry } from '../../../src/extractors/registry.js';
import { ScannedPdfError } from '../../../src/core/errors.js';
import type { IExtractor, ExtractionResult } from '../../../src/extractors/types.js';

// Mock PdfOcrExtractor to avoid loading real tesseract/pdfjs
vi.mock('../../../src/extractors/pdf-ocr.js', () => ({
  PdfOcrExtractor: vi.fn(() => ({
    supportedExtensions: ['.pdf'],
    canHandle: (ext: string) => ext === '.pdf',
    extract: vi.fn(async () => ({
      html: '<article data-source="ocr"><p>OCR text</p></article>',
      metadata: { isScanned: true, sourceFormat: 'pdf', ocrConfidence: 80, ocrEngine: 'tesseract' },
      warnings: [],
    })),
  })),
}));

describe('ExtractorRegistry Fallback', () => {
  it('should create registry with OCR fallback by default', () => {
    const registry = new ExtractorRegistry();
    expect(registry.getSupportedFormats()).toContain('.pdf');
  });

  it('should create registry without OCR fallback when disabled', () => {
    const registry = new ExtractorRegistry({ ocrEnabled: false });
    expect(registry.getSupportedFormats()).toContain('.pdf');
  });

  it('should use primary extractor when extraction succeeds', async () => {
    const registry = new ExtractorRegistry();
    const mockResult: ExtractionResult = {
      html: '<article><p>Text PDF</p></article>',
      metadata: { isScanned: false, sourceFormat: 'pdf' },
      warnings: [],
    };
    const mockExtractor: IExtractor = {
      supportedExtensions: ['.pdf'],
      canHandle: () => true,
      extract: vi.fn(async () => mockResult),
    };

    const result = await registry.extractWithFallback(mockExtractor, Buffer.from('test'), {
      fileName: 'test.pdf',
      extension: '.pdf',
      sizeBytes: 100,
    });

    expect(result.metadata.isScanned).toBe(false);
    expect(result.html).toContain('Text PDF');
  });

  it('should fallback to OCR extractor on ScannedPdfError', async () => {
    const registry = new ExtractorRegistry();
    const mockExtractor: IExtractor = {
      supportedExtensions: ['.pdf'],
      canHandle: () => true,
      extract: vi.fn(async () => {
        throw new ScannedPdfError('PDF appears to be scanned');
      }),
    };

    const result = await registry.extractWithFallback(mockExtractor, Buffer.from('test'), {
      fileName: 'scanned.pdf',
      extension: '.pdf',
      sizeBytes: 100,
    });

    expect(result.metadata.isScanned).toBe(true);
    expect(result.html).toContain('data-source="ocr"');
  });

  it('should rethrow ScannedPdfError when OCR is disabled', async () => {
    const registry = new ExtractorRegistry({ ocrEnabled: false });
    const mockExtractor: IExtractor = {
      supportedExtensions: ['.pdf'],
      canHandle: () => true,
      extract: vi.fn(async () => {
        throw new ScannedPdfError('PDF appears to be scanned');
      }),
    };

    await expect(
      registry.extractWithFallback(mockExtractor, Buffer.from('test'), {
        fileName: 'scanned.pdf',
        extension: '.pdf',
        sizeBytes: 100,
      }),
    ).rejects.toThrow(ScannedPdfError);
  });

  it('should rethrow non-ScannedPdfError errors', async () => {
    const registry = new ExtractorRegistry();
    const mockExtractor: IExtractor = {
      supportedExtensions: ['.pdf'],
      canHandle: () => true,
      extract: vi.fn(async () => {
        throw new Error('Corrupted file');
      }),
    };

    await expect(
      registry.extractWithFallback(mockExtractor, Buffer.from('test'), {
        fileName: 'bad.pdf',
        extension: '.pdf',
        sizeBytes: 100,
      }),
    ).rejects.toThrow('Corrupted file');
  });
});

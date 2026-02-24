import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TesseractOcrProvider } from '../../../../src/extractors/ocr/tesseract-provider.js';
import type { OcrConfig } from '../../../../src/extractors/ocr/types.js';

// Mock tesseract.js
const mockRecognize = vi.fn();
const mockTerminate = vi.fn();
const mockWorker = {
  recognize: mockRecognize,
  terminate: mockTerminate,
};
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => Promise.resolve(mockWorker)),
}));

const testConfig: OcrConfig = {
  language: 'eng',
  dpi: 300,
  concurrency: 2,
  confidenceThreshold: 60,
};

describe('TesseractOcrProvider', () => {
  let provider: TesseractOcrProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new TesseractOcrProvider();
  });

  it('should have name "tesseract"', () => {
    expect(provider.name).toBe('tesseract');
  });

  it('should throw if recognizePage called before initialize', async () => {
    await expect(provider.recognizePage(Buffer.from('test'), 1)).rejects.toThrow(
      'not initialized',
    );
  });

  it('should initialize worker pool', async () => {
    const { createWorker } = await import('tesseract.js');
    await provider.initialize(testConfig);
    expect(createWorker).toHaveBeenCalledTimes(2); // concurrency: 2
  });

  it('should recognize page and return result', async () => {
    mockRecognize.mockResolvedValue({
      data: { text: 'Hello World\n\nSecond paragraph', confidence: 85 },
    });

    await provider.initialize(testConfig);
    const result = await provider.recognizePage(Buffer.from('fake-image'), 1);

    expect(result.pageNumber).toBe(1);
    expect(result.text).toBe('Hello World\n\nSecond paragraph');
    expect(result.confidence).toBe(85);
    expect(result.warnings).toHaveLength(0);
  });

  it('should warn on low confidence', async () => {
    mockRecognize.mockResolvedValue({
      data: { text: 'blurry text', confidence: 40 },
    });

    await provider.initialize(testConfig);
    const result = await provider.recognizePage(Buffer.from('fake-image'), 3);

    expect(result.confidence).toBe(40);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('low OCR confidence');
    expect(result.warnings[0]).toContain('Page 3');
  });

  it('should warn on empty text', async () => {
    mockRecognize.mockResolvedValue({
      data: { text: '   ', confidence: 90 },
    });

    await provider.initialize(testConfig);
    const result = await provider.recognizePage(Buffer.from('fake-image'), 1);

    expect(result.text).toBe('');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('no text');
  });

  it('should terminate all workers', async () => {
    await provider.initialize(testConfig);
    await provider.terminate();
    expect(mockTerminate).toHaveBeenCalledTimes(2);
  });
});

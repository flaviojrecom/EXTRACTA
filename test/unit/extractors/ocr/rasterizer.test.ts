import { describe, it, expect, vi } from 'vitest';
import { PdfRasterizer } from '../../../../src/extractors/ocr/rasterizer.js';

// Mock pdfjs-dist
const mockGetPage = vi.fn();
const mockDestroy = vi.fn();
const mockGetDocument = vi.fn(() => ({
  promise: Promise.resolve({
    numPages: 2,
    getPage: mockGetPage,
    destroy: mockDestroy,
  }),
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}));

// Mock canvas
const mockToBuffer = vi.fn(() => Buffer.from('fake-png'));
const mockGetContext = vi.fn(() => ({}));
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: mockGetContext,
    toBuffer: mockToBuffer,
  })),
}));

describe('PdfRasterizer', () => {
  it('should rasterize all pages', async () => {
    const mockRender = vi.fn(() => ({ promise: Promise.resolve() }));
    const mockViewport = { width: 612, height: 792 };
    mockGetPage.mockResolvedValue({
      getViewport: () => mockViewport,
      render: mockRender,
    });

    const rasterizer = new PdfRasterizer();
    const pages = await rasterizer.rasterize(Buffer.from('fake-pdf'), 150);

    expect(pages).toHaveLength(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].pageNumber).toBe(2);
    expect(pages[0].imageBuffer).toBeInstanceOf(Buffer);
    expect(pages[0].width).toBe(612);
    expect(pages[0].height).toBe(792);
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('should rasterize single page', async () => {
    const mockRender = vi.fn(() => ({ promise: Promise.resolve() }));
    mockGetPage.mockResolvedValue({
      getViewport: () => ({ width: 300, height: 400 }),
      render: mockRender,
    });

    const rasterizer = new PdfRasterizer();
    const page = await rasterizer.rasterizePage(Buffer.from('fake-pdf'), 1, 300);

    expect(page.pageNumber).toBe(1);
    expect(page.imageBuffer).toBeInstanceOf(Buffer);
  });

  it('should throw for out-of-range page number', async () => {
    const rasterizer = new PdfRasterizer();
    await expect(rasterizer.rasterizePage(Buffer.from('fake-pdf'), 5, 300)).rejects.toThrow(
      'out of range',
    );
  });
});

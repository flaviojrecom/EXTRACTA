import type { RasterizedPage } from './types.js';

export class PdfRasterizer {
  async rasterize(pdfBuffer: Buffer, dpi: number = 300): Promise<RasterizedPage[]> {
    const pdfjs = await this.loadPdfjs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
    const pages: RasterizedPage[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await this.rasterizeSinglePage(doc, i, dpi);
      pages.push(page);
    }

    doc.destroy();
    return pages;
  }

  async rasterizePage(pdfBuffer: Buffer, pageNumber: number, dpi: number = 300): Promise<RasterizedPage> {
    const pdfjs = await this.loadPdfjs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;

    if (pageNumber < 1 || pageNumber > doc.numPages) {
      doc.destroy();
      throw new Error(`Page ${pageNumber} out of range (1-${doc.numPages})`);
    }

    const result = await this.rasterizeSinglePage(doc, pageNumber, dpi);
    doc.destroy();
    return result;
  }

  private async rasterizeSinglePage(
    doc: { getPage: (n: number) => Promise<unknown> },
    pageNumber: number,
    dpi: number,
  ): Promise<RasterizedPage> {
    const { createCanvas } = await import('canvas');
    const page = await doc.getPage(pageNumber) as {
      getViewport: (opts: { scale: number }) => { width: number; height: number };
      render: (opts: { canvasContext: unknown; viewport: unknown }) => { promise: Promise<void> };
    };

    const scale = dpi / 72;
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
    const context = canvas.getContext('2d');

    await page.render({ canvasContext: context, viewport }).promise;

    const pngBuffer = canvas.toBuffer('image/png');

    return {
      pageNumber,
      imageBuffer: pngBuffer,
      width: Math.floor(viewport.width),
      height: Math.floor(viewport.height),
    };
  }

  private async loadPdfjs() {
    // Use legacy build for Node.js compatibility
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    return pdfjs;
  }
}

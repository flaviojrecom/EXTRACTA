export interface OcrConfig {
  /** OCR language(s) — Tesseract format. Default: 'eng' */
  language: string;
  /** Render DPI for rasterization. Default: 300 */
  dpi: number;
  /** Max concurrent pages to OCR. Default: 4 */
  concurrency: number;
  /** Confidence threshold (0-100). Below this, add warning. Default: 60 */
  confidenceThreshold: number;
}

export const DEFAULT_OCR_CONFIG: OcrConfig = {
  language: 'eng',
  dpi: 300,
  concurrency: 4,
  confidenceThreshold: 60,
};

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  warnings: string[];
}

export interface RasterizedPage {
  pageNumber: number;
  imageBuffer: Buffer;
  width: number;
  height: number;
}

export interface OcrProvider {
  name: string;
  initialize(config: OcrConfig): Promise<void>;
  recognizePage(imageBuffer: Buffer, pageNumber: number): Promise<OcrPageResult>;
  terminate(): Promise<void>;
}

import { createWorker, type Worker } from 'tesseract.js';
import type { OcrProvider, OcrConfig, OcrPageResult } from './types.js';

export class TesseractOcrProvider implements OcrProvider {
  name = 'tesseract';
  private workers: Worker[] = [];
  private config: OcrConfig | null = null;
  private workerIndex = 0;

  async initialize(config: OcrConfig): Promise<void> {
    this.config = config;
    const count = Math.max(1, config.concurrency);

    for (let i = 0; i < count; i++) {
      const worker = await createWorker(config.language);
      this.workers.push(worker);
    }
  }

  async recognizePage(imageBuffer: Buffer, pageNumber: number): Promise<OcrPageResult> {
    if (this.workers.length === 0) {
      throw new Error('TesseractOcrProvider not initialized. Call initialize() first.');
    }

    const worker = this.workers[this.workerIndex % this.workers.length];
    this.workerIndex++;

    const result = await worker.recognize(imageBuffer);
    const confidence = result.data.confidence;
    const text = result.data.text.trim();
    const warnings: string[] = [];

    if (this.config && confidence < this.config.confidenceThreshold) {
      warnings.push(
        `Page ${pageNumber} has low OCR confidence (${Math.round(confidence)}%, threshold: ${this.config.confidenceThreshold}%)`,
      );
    }

    if (text.length === 0) {
      warnings.push(`Page ${pageNumber} produced no text after OCR`);
    }

    return { pageNumber, text, confidence, warnings };
  }

  async terminate(): Promise<void> {
    for (const worker of this.workers) {
      await worker.terminate();
    }
    this.workers = [];
    this.workerIndex = 0;
  }
}

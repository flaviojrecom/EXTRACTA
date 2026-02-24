import { createWorker, type Worker } from 'tesseract.js';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import type { OcrProvider, OcrConfig, OcrPageResult } from './types.js';

function resolveWorkerPath(): string {
  // Walk up from node_modules/tesseract.js to find the worker script
  try {
    // Try common locations
    const candidates = [
      join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js'),
      join(dirname(require.resolve('tesseract.js')), 'src', 'worker-script', 'node', 'index.js'),
    ];
    for (const p of candidates) {
      if (existsSync(p)) return p;
    }
  } catch { /* fallthrough */ }
  // Absolute fallback using process.cwd
  return join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
}

export class TesseractOcrProvider implements OcrProvider {
  name = 'tesseract';
  private workers: Worker[] = [];
  private config: OcrConfig | null = null;
  private workerIndex = 0;

  async initialize(config: OcrConfig): Promise<void> {
    this.config = config;
    const count = Math.max(1, config.concurrency);
    const workerPath = resolveWorkerPath();

    for (let i = 0; i < count; i++) {
      const worker = await createWorker(config.language, undefined, {
        workerBlobURL: false,
        workerPath,
      });
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

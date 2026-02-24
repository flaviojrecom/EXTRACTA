import type { IExtractor, ExtractionResult, FileMetadata, DocumentMetadata } from './types.js';

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class TxtExtractor implements IExtractor {
  supportedExtensions = ['.txt', '.text'];

  canHandle(extension: string): boolean {
    return this.supportedExtensions.includes(extension.toLowerCase());
  }

  async extract(input: Buffer, metadata?: FileMetadata): Promise<ExtractionResult> {
    const text = input.toString('utf-8');
    const warnings: string[] = [];

    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const body = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
    const html = `<article>\n${body}\n</article>`;

    const docMetadata: DocumentMetadata = {
      title: metadata?.fileName,
      sourceFormat: 'txt',
    };

    return { html, metadata: docMetadata, warnings };
  }
}

import type { ITokenizer } from './types.js';

let _encoder: { encode: (text: string) => number[] } | null = null;

async function getEncoder(): Promise<{ encode: (text: string) => number[] }> {
  if (!_encoder) {
    const { encodingForModel } = await import('js-tiktoken');
    _encoder = encodingForModel('gpt-4');
  }
  return _encoder;
}

export class TiktokenTokenizer implements ITokenizer {
  name = 'cl100k_base';

  private encoder: { encode: (text: string) => number[] } | null = null;

  private async ensureEncoder(): Promise<{ encode: (text: string) => number[] }> {
    if (!this.encoder) {
      this.encoder = await getEncoder();
    }
    return this.encoder;
  }

  encode(text: string): number[] {
    if (!this.encoder) {
      throw new Error('Tokenizer not initialized. Call countTokens() first or use countTokensSync after init.');
    }
    return this.encoder.encode(text);
  }

  countTokens(text: string): number {
    if (!this.encoder) {
      throw new Error('Tokenizer not initialized. Call init() first.');
    }
    return this.encoder.encode(text).length;
  }

  async init(): Promise<void> {
    await this.ensureEncoder();
  }

  async countTokensAsync(text: string): Promise<number> {
    const enc = await this.ensureEncoder();
    return enc.encode(text).length;
  }
}

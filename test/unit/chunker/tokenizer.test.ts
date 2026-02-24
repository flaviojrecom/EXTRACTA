import { describe, it, expect, beforeAll } from 'vitest';
import { TiktokenTokenizer } from '../../../src/chunker/tokenizer.js';

describe('TiktokenTokenizer', () => {
  const tokenizer = new TiktokenTokenizer();

  beforeAll(async () => {
    await tokenizer.init();
  });

  it('should have name cl100k_base', () => {
    expect(tokenizer.name).toBe('cl100k_base');
  });

  it('should encode text to token IDs', () => {
    const tokens = tokenizer.encode('Hello world');
    expect(tokens).toBeInstanceOf(Array);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((t) => typeof t === 'number')).toBe(true);
  });

  it('should count tokens', () => {
    const count = tokenizer.countTokens('Hello world');
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(10);
  });

  it('should count more tokens for longer text', () => {
    const short = tokenizer.countTokens('Hello');
    const long = tokenizer.countTokens('Hello world, this is a much longer sentence with many more words');
    expect(long).toBeGreaterThan(short);
  });

  it('should handle empty string', () => {
    expect(tokenizer.countTokens('')).toBe(0);
  });

  it('should throw if used before init', () => {
    const fresh = new TiktokenTokenizer();
    expect(() => fresh.countTokens('test')).toThrow('not initialized');
  });

  it('should support async countTokens', async () => {
    const count = await tokenizer.countTokensAsync('Hello world');
    expect(count).toBeGreaterThan(0);
  });
});

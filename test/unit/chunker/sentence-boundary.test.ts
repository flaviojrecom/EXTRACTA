import { describe, it, expect } from 'vitest';
import { splitSentences } from '../../../src/chunker/sentence-boundary.js';

describe('Sentence Boundary Detection', () => {
  it('should split simple sentences', () => {
    const sentences = splitSentences('Hello world. How are you? I am fine!');
    expect(sentences).toHaveLength(3);
    expect(sentences[0].text).toBe('Hello world.');
    expect(sentences[1].text).toBe('How are you?');
    expect(sentences[2].text).toBe('I am fine!');
  });

  it('should handle single sentence', () => {
    const sentences = splitSentences('Just one sentence.');
    expect(sentences).toHaveLength(1);
    expect(sentences[0].text).toBe('Just one sentence.');
  });

  it('should handle abbreviations (Dr., Mr., etc.)', () => {
    const sentences = splitSentences('Dr. Smith went to the store. He bought milk.');
    expect(sentences).toHaveLength(2);
    expect(sentences[0].text).toContain('Dr. Smith');
  });

  it('should handle Portuguese abbreviations (Sr., Sra.)', () => {
    const sentences = splitSentences('O Sr. Silva chegou. Ele trouxe flores.');
    expect(sentences).toHaveLength(2);
    expect(sentences[0].text).toContain('Sr. Silva');
  });

  it('should not split on decimal numbers', () => {
    const sentences = splitSentences('The value is 3.14 approximately. That is pi.');
    expect(sentences).toHaveLength(2);
    expect(sentences[0].text).toContain('3.14');
  });

  it('should not split on ellipsis', () => {
    const sentences = splitSentences('Well... that was unexpected. Indeed.');
    expect(sentences).toHaveLength(2);
    expect(sentences[0].text).toContain('...');
  });

  it('should handle e.g. and i.e.', () => {
    const sentences = splitSentences('Use tools e.g. hammers and nails. They work well.');
    expect(sentences).toHaveLength(2);
  });

  it('should return empty array for empty string', () => {
    expect(splitSentences('')).toHaveLength(0);
    expect(splitSentences('   ')).toHaveLength(0);
  });

  it('should track positions', () => {
    const sentences = splitSentences('First. Second.');
    expect(sentences[0].start).toBe(0);
    expect(sentences[0].end).toBeGreaterThan(0);
    expect(sentences[1].start).toBeGreaterThan(sentences[0].end - 1);
  });

  it('should handle sentence starting with number', () => {
    const sentences = splitSentences('The count is done. 42 is the answer.');
    expect(sentences).toHaveLength(2);
  });
});

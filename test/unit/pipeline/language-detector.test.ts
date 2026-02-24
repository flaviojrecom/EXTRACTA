import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../../../src/pipeline/language-detector.js';

describe('Language Detector', () => {
  it('should detect English text', () => {
    const text = 'The quick brown fox jumps over the lazy dog and it was a great day for all of the people who have been waiting for this to happen in the world';
    const result = detectLanguage(text);
    expect(result.language).toBe('en');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect Portuguese text', () => {
    const text = 'O Brasil é um país muito grande e tem uma população de mais de duzentos milhões de pessoas que vivem em todas as regiões do seu território nacional';
    const result = detectLanguage(text);
    expect(result.language).toBe('pt');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect Spanish text', () => {
    const text = 'La casa de mi amigo es muy grande y tiene un jardín muy bonito con muchas flores de todos los colores que se pueden imaginar en el mundo';
    const result = detectLanguage(text);
    expect(result.language).toBe('es');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return unknown for very short text', () => {
    const result = detectLanguage('Hello world');
    expect(result.language).toBe('unknown');
    expect(result.confidence).toBe(0);
  });

  it('should strip HTML tags before analysis', () => {
    const html = '<p>The quick brown fox jumps over the lazy dog and it was a great day for all of the people who have been waiting</p>';
    const result = detectLanguage(html);
    expect(result.language).toBe('en');
  });

  it('should return unknown for ambiguous text', () => {
    const text = '123 456 789 000 111 222 333 444 555 666 777 888 999';
    const result = detectLanguage(text);
    expect(result.language).toBe('unknown');
  });
});

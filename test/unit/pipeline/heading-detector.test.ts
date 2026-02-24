import { describe, it, expect } from 'vitest';
import { detectHeadings } from '../../../src/pipeline/heading-detector.js';

describe('Heading Detector', () => {
  describe('HTML tag headings', () => {
    it('should detect h1-h6 tags', () => {
      const html = '<h1>Title</h1><p>Content</p><h2>Section</h2><p>More</p>';
      const headings = detectHeadings(html);
      expect(headings).toHaveLength(2);
      expect(headings[0]).toMatchObject({ text: 'Title', level: 1, confidence: 1.0, source: 'html-tag' });
      expect(headings[1]).toMatchObject({ text: 'Section', level: 2, confidence: 1.0, source: 'html-tag' });
    });

    it('should strip inner tags from heading text', () => {
      const html = '<h1><strong>Bold Title</strong></h1>';
      const headings = detectHeadings(html);
      expect(headings[0].text).toBe('Bold Title');
    });

    it('should skip empty headings', () => {
      const html = '<h1></h1><h2>Real</h2>';
      const headings = detectHeadings(html);
      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe('Real');
    });
  });

  describe('Numbering patterns', () => {
    it('should detect dotted numbering (1.1. style)', () => {
      const html = '<p>1. Introduction</p><p>Content here</p><p>1.1. Background</p>';
      const headings = detectHeadings(html);
      const numbered = headings.filter(h => h.source === 'numbering');
      expect(numbered.length).toBeGreaterThanOrEqual(2);
      expect(numbered[0]).toMatchObject({ text: '1. Introduction', level: 1 });
      expect(numbered[1]).toMatchObject({ text: '1.1. Background', level: 2 });
    });

    it('should detect Roman numeral headings', () => {
      const html = '<p>I. First Part</p><p>Some content</p><p>II. Second Part</p>';
      const headings = detectHeadings(html);
      const roman = headings.filter(h => h.source === 'numbering');
      expect(roman.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Uppercase detection', () => {
    it('should detect short ALL CAPS lines as headings', () => {
      const html = '<p>INTRODUCTION</p><p>This is normal text that goes on for a while to fill some space.</p>';
      const headings = detectHeadings(html);
      const upper = headings.filter(h => h.source === 'uppercase');
      expect(upper).toHaveLength(1);
      expect(upper[0]).toMatchObject({ text: 'INTRODUCTION', level: 2, confidence: 0.5 });
    });

    it('should not detect long ALL CAPS as headings', () => {
      const longCaps = 'A'.repeat(101);
      const html = `<p>${longCaps}</p>`;
      const headings = detectHeadings(html);
      expect(headings.filter(h => h.source === 'uppercase')).toHaveLength(0);
    });
  });

  describe('Linguistic patterns', () => {
    it('should detect "Chapter" pattern', () => {
      const html = '<p>Chapter 1 The Beginning</p><p>Content</p>';
      const headings = detectHeadings(html);
      const ling = headings.filter(h => h.source === 'linguistic');
      expect(ling).toHaveLength(1);
      expect(ling[0].level).toBe(1);
    });

    it('should detect "Capítulo" pattern (Portuguese)', () => {
      const html = '<p>Capítulo 2 O Começo</p><p>Conteúdo</p>';
      const headings = detectHeadings(html);
      const ling = headings.filter(h => h.source === 'linguistic');
      expect(ling).toHaveLength(1);
    });

    it('should detect "Section" pattern', () => {
      const html = '<p>Section 3 Details</p>';
      const headings = detectHeadings(html);
      const ling = headings.filter(h => h.source === 'linguistic');
      expect(ling).toHaveLength(1);
      expect(ling[0].level).toBe(2);
    });
  });

  describe('Deduplication', () => {
    it('should keep highest confidence when multiple signals at same position', () => {
      // h1 tag has confidence 1.0 which beats any paragraph-based detection
      const html = '<h1>CHAPTER ONE</h1><p>Content</p>';
      const headings = detectHeadings(html);
      expect(headings).toHaveLength(1);
      expect(headings[0].confidence).toBe(1.0);
    });
  });

  describe('Sorting', () => {
    it('should return headings sorted by position', () => {
      const html = '<h2>Second</h2><h1>First</h1>';
      const headings = detectHeadings(html);
      expect(headings[0].position).toBeLessThan(headings[1].position);
    });
  });
});

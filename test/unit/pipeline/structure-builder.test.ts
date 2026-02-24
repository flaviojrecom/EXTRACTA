import { describe, it, expect } from 'vitest';
import { StructureBuilder } from '../../../src/pipeline/structure-builder.js';

describe('StructureBuilder', () => {
  const builder = new StructureBuilder();

  describe('Hierarchy building', () => {
    it('should build hierarchy from HTML headings', async () => {
      const html = '<h1>Chapter 1</h1><p>Intro text</p><h2>Section 1.1</h2><p>Details</p><h2>Section 1.2</h2><p>More details</p>';
      const doc = await builder.process(html);

      expect(doc.sections).toHaveLength(1);
      expect(doc.sections[0].title).toBe('Chapter 1');
      expect(doc.sections[0].level).toBe(1);
      expect(doc.sections[0].children).toHaveLength(2);
      expect(doc.sections[0].children[0].title).toBe('Section 1.1');
      expect(doc.sections[0].children[1].title).toBe('Section 1.2');
    });

    it('should handle multiple top-level chapters', async () => {
      const html = '<h1>Chapter 1</h1><p>Content 1</p><h1>Chapter 2</h1><p>Content 2</p>';
      const doc = await builder.process(html);

      expect(doc.sections).toHaveLength(2);
      expect(doc.sections[0].title).toBe('Chapter 1');
      expect(doc.sections[1].title).toBe('Chapter 2');
    });

    it('should handle deeply nested sections', async () => {
      const html = '<h1>L1</h1><h2>L2</h2><h3>L3</h3><h4>L4</h4><p>Deep content</p>';
      const doc = await builder.process(html);

      expect(doc.sections[0].children[0].children[0].children[0].level).toBe(4);
    });
  });

  describe('Graceful degradation', () => {
    it('should create single section for flat documents', async () => {
      const html = '<p>Just a paragraph of text without any headings at all.</p>';
      const doc = await builder.process(html);

      expect(doc.sections).toHaveLength(1);
      expect(doc.sections[0].title).toBe('Document');
      expect(doc.sections[0].level).toBe(1);
      expect(doc.sections[0].content).toContain('Just a paragraph');
    });
  });

  describe('Section IDs', () => {
    it('should generate hierarchical IDs', async () => {
      const html = '<h1>Ch1</h1><h2>S1</h2><h2>S2</h2><h1>Ch2</h1><h2>S1</h2>';
      const doc = await builder.process(html);

      expect(doc.sections[0].id).toBe('ch1');
      expect(doc.sections[0].children[0].id).toContain('s');
      expect(doc.sections[1].id).toBe('ch2');
    });
  });

  describe('Markdown content', () => {
    it('should convert section content to Markdown', async () => {
      const html = '<h1>Title</h1><p>Hello <strong>world</strong></p><ul><li>Item 1</li></ul>';
      const doc = await builder.process(html);

      expect(doc.sections[0].content).toContain('**world**');
      expect(doc.sections[0].content).toContain('- Item 1');
    });
  });

  describe('Section metadata', () => {
    it('should compute wordCount and charCount', async () => {
      const html = '<h1>Title</h1><p>Hello world foo bar</p>';
      const doc = await builder.process(html);

      expect(doc.sections[0].meta.wordCount).toBeGreaterThan(0);
      expect(doc.sections[0].meta.charCount).toBeGreaterThan(0);
    });

    it('should set chapter metadata', async () => {
      const html = '<h1>Chapter One</h1><h2>Details</h2><p>Content</p>';
      const doc = await builder.process(html);

      expect(doc.sections[0].meta.chapter).toBe('Chapter One');
      expect(doc.sections[0].children[0].meta.chapter).toBe('Chapter One');
    });
  });

  describe('Document metadata', () => {
    it('should use first heading as title', async () => {
      const html = '<h1>My Document</h1><p>Content</p>';
      const doc = await builder.process(html);
      expect(doc.metadata.title).toBe('My Document');
    });

    it('should use existing metadata when provided', async () => {
      const b = new StructureBuilder({ title: 'Custom', sourceFormat: 'pdf' });
      const doc = await b.process('<h1>Other</h1><p>Content</p>');
      expect(doc.metadata.title).toBe('Custom');
      expect(doc.metadata.sourceFormat).toBe('pdf');
    });

    it('should detect author from "by Author" pattern', async () => {
      const html = '<h1>Title</h1><p>by John Smith</p><p>Content goes here for language detection to work properly</p>';
      const doc = await builder.process(html);
      expect(doc.metadata.author).toBe('John Smith');
    });

    it('should detect language', async () => {
      const html = '<h1>Intro</h1><p>The quick brown fox jumps over the lazy dog and it was a great day for all of the people who have been waiting for this to happen in the world</p>';
      const doc = await builder.process(html);
      expect(doc.metadata.language).toBe('en');
    });
  });

  describe('Quality indicators', () => {
    it('should compute structurePreserved from heading confidence', async () => {
      const html = '<h1>Title</h1><h2>Section</h2><p>Content</p>';
      const doc = await builder.process(html);
      expect(doc.qualityIndicators.structurePreserved).toBe(100); // HTML tags have confidence 1.0
    });

    it('should compute metadataCompleteness', async () => {
      const b = new StructureBuilder({ title: 'T', author: 'A', language: 'en', sourceFormat: 'pdf' });
      const doc = await b.process('<h1>T</h1><p>Content</p>');
      expect(doc.qualityIndicators.metadataCompleteness).toBe(100);
    });

    it('should have lower structurePreserved for flat docs', async () => {
      const html = '<p>Just content without any headings at all.</p>';
      const doc = await builder.process(html);
      expect(doc.qualityIndicators.structurePreserved).toBeLessThan(50);
    });
  });

  describe('Progress reporting', () => {
    it('should call onProgress callback', async () => {
      const progress: number[] = [];
      await builder.process('<h1>Title</h1><p>Content</p>', {
        onProgress: (pct) => progress.push(pct),
      });
      expect(progress).toContain(0);
      expect(progress).toContain(100);
    });
  });
});

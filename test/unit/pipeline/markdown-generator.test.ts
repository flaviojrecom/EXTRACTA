import { describe, it, expect } from 'vitest';
import { htmlToMarkdown } from '../../../src/pipeline/markdown-generator.js';

describe('Markdown Generator', () => {
  describe('Headings', () => {
    it('should convert h1-h6 to markdown headings', () => {
      const md = htmlToMarkdown('<h1>Title</h1><h2>Section</h2><h3>Sub</h3>');
      expect(md).toContain('# Title');
      expect(md).toContain('## Section');
      expect(md).toContain('### Sub');
    });
  });

  describe('Paragraphs', () => {
    it('should convert paragraphs', () => {
      const md = htmlToMarkdown('<p>Hello world</p><p>Second paragraph</p>');
      expect(md).toContain('Hello world');
      expect(md).toContain('Second paragraph');
    });

    it('should skip empty paragraphs', () => {
      const md = htmlToMarkdown('<p></p><p>Real content</p>');
      expect(md.trim()).toBe('Real content');
    });
  });

  describe('Inline formatting', () => {
    it('should convert strong/b to bold', () => {
      const md = htmlToMarkdown('<p><strong>bold</strong> and <b>also bold</b></p>');
      expect(md).toContain('**bold**');
      expect(md).toContain('**also bold**');
    });

    it('should convert em/i to italic', () => {
      const md = htmlToMarkdown('<p><em>italic</em> and <i>also italic</i></p>');
      expect(md).toContain('*italic*');
      expect(md).toContain('*also italic*');
    });

    it('should convert links', () => {
      const md = htmlToMarkdown('<p><a href="https://example.com">click</a></p>');
      expect(md).toContain('[click](https://example.com)');
    });

    it('should handle links without href', () => {
      const md = htmlToMarkdown('<p><a>plain</a></p>');
      expect(md).toContain('plain');
      expect(md).not.toContain('[');
    });
  });

  describe('Lists', () => {
    it('should convert unordered lists', () => {
      const md = htmlToMarkdown('<ul><li>One</li><li>Two</li></ul>');
      expect(md).toContain('- One');
      expect(md).toContain('- Two');
    });

    it('should convert ordered lists', () => {
      const md = htmlToMarkdown('<ol><li>First</li><li>Second</li></ol>');
      expect(md).toContain('1. First');
      expect(md).toContain('2. Second');
    });
  });

  describe('Code', () => {
    it('should convert inline code', () => {
      const md = htmlToMarkdown('<p>Use <code>console.log</code> for debug</p>');
      expect(md).toContain('`console.log`');
    });

    it('should convert code blocks (pre+code)', () => {
      const md = htmlToMarkdown('<pre><code>const x = 1;</code></pre>');
      expect(md).toContain('```');
      expect(md).toContain('const x = 1;');
    });

    it('should handle pre without code', () => {
      const md = htmlToMarkdown('<pre>preformatted text</pre>');
      expect(md).toContain('```');
      expect(md).toContain('preformatted text');
    });
  });

  describe('Blockquotes', () => {
    it('should convert blockquotes', () => {
      const md = htmlToMarkdown('<blockquote>A wise quote</blockquote>');
      expect(md).toContain('> A wise quote');
    });
  });

  describe('Tables', () => {
    it('should convert simple tables', () => {
      const html = '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>30</td></tr></table>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('| Name | Age |');
      expect(md).toContain('| --- | --- |');
      expect(md).toContain('| Alice | 30 |');
    });

    it('should handle tables with uneven columns', () => {
      const html = '<table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td>1</td><td>2</td></tr></table>';
      const md = htmlToMarkdown(html);
      expect(md).toContain('| A | B | C |');
      // Second row should be padded
      expect(md).toContain('| 1 | 2 |');
    });
  });

  describe('Line breaks and rules', () => {
    it('should convert br to newline', () => {
      const md = htmlToMarkdown('<p>Line one<br/>Line two</p>');
      expect(md).toContain('Line one\nLine two');
    });

    it('should convert hr to markdown rule', () => {
      const md = htmlToMarkdown('<hr/>');
      expect(md).toContain('---');
    });
  });

  describe('Container elements', () => {
    it('should pass through div/section/article content', () => {
      const md = htmlToMarkdown('<article><section><div><p>Nested content</p></div></section></article>');
      expect(md).toContain('Nested content');
    });
  });
});

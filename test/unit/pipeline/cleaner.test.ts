import { Cleaner, detectRepeatedPatterns } from '../../../src/pipeline/cleaner.js';
import { validateStandardHtml } from '../../../src/core/standard-html.js';

describe('Cleaner', () => {
  describe('light level', () => {
    const cleaner = new Cleaner('light');

    it('should remove page numbers', async () => {
      const html = '<article><p>Content here</p><p>42</p><p>More content</p><p>- 43 -</p></article>';
      const { html: result, auditLog } = await cleaner.process(html);
      expect(result).not.toContain('>42<');
      expect(result).not.toContain('- 43 -');
      expect(result).toContain('Content here');
      expect(auditLog.some((e) => e.type === 'page_number')).toBe(true);
    });

    it('should remove "Page N" patterns', async () => {
      const html = '<article><p>Text</p><p>Page 12</p><p>page 5 of 100</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).not.toContain('Page 12');
      expect(result).not.toContain('page 5');
    });

    it('should collapse excessive blank lines', async () => {
      const html = '<article><p>A</p>\n\n\n\n\n<p>B</p></article>';
      const { html: result, auditLog } = await cleaner.process(html);
      expect(result).not.toMatch(/\n{3,}/);
      expect(auditLog.some((e) => e.type === 'whitespace')).toBe(true);
    });

    it('should NOT remove ISBN in light mode', async () => {
      const html = '<article><p>ISBN 978-3-16-148410-0</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).toContain('ISBN');
    });

    it('should NOT remove legal credits in light mode', async () => {
      const html = '<article><p>Copyright 2024 Acme Corp. All rights reserved.</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).toContain('Copyright');
    });
  });

  describe('standard level', () => {
    const cleaner = new Cleaner('standard');

    it('should remove ISBN', async () => {
      const html = '<article><p>ISBN 978-3-16-148410-0</p><p>Content</p></article>';
      const { html: result, auditLog } = await cleaner.process(html);
      expect(result).not.toContain('978-3-16-148410-0');
      expect(auditLog.some((e) => e.type === 'isbn')).toBe(true);
    });

    it('should remove copyright notices', async () => {
      const html = '<article><p>Copyright 2024 Acme Corp</p><p>Real content</p></article>';
      const { html: result, auditLog } = await cleaner.process(html);
      expect(result).not.toContain('Copyright');
      expect(result).toContain('Real content');
      expect(auditLog.some((e) => e.type === 'legal_credit')).toBe(true);
    });

    it('should remove "All rights reserved" paragraphs', async () => {
      const html = '<article><p>Text here</p><p>All rights reserved by the publisher</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).not.toContain('All rights reserved');
    });

    it('should remove "Published by" paragraphs', async () => {
      const html = '<article><p>Published by Penguin Books</p><p>Chapter 1</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).not.toContain('Published by');
    });
  });

  describe('aggressive level', () => {
    const cleaner = new Cleaner('aggressive');

    it('should remove decorative line separators', async () => {
      const html = '<article><p>Text</p><p>***</p><p>More text</p><p>===</p></article>';
      const { html: result, auditLog } = await cleaner.process(html);
      expect(result).not.toContain('***');
      expect(result).not.toContain('===');
      expect(auditLog.some((e) => e.type === 'decorative')).toBe(true);
    });

    it('should also apply standard and light removals', async () => {
      const html = '<article><p>42</p><p>ISBN 978-3-16-148410-0</p><p>Content</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).not.toContain('>42<');
      expect(result).not.toContain('ISBN');
      expect(result).toContain('Content');
    });
  });

  describe('false positive protection', () => {
    const cleaner = new Cleaner('standard');

    it('should preserve real content that looks like numbers', async () => {
      const html = '<article><p>The year was 1984 and the population was 42000</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).toContain('1984');
      expect(result).toContain('42000');
    });

    it('should preserve meaningful short text', async () => {
      const html = '<article><p>Introduction</p><p>Text content here</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).toContain('Introduction');
    });
  });

  describe('output validity', () => {
    const cleaner = new Cleaner('standard');

    it('should produce valid StandardHTML', async () => {
      const html = '<article><p>42</p><p>Content</p><p>Copyright 2024</p></article>';
      const { html: result } = await cleaner.process(html);
      const validation = validateStandardHtml(result);
      expect(validation.valid).toBe(true);
    });

    it('should remove empty tags after cleaning', async () => {
      const html = '<article><p>42</p><p></p><p>Content</p></article>';
      const { html: result } = await cleaner.process(html);
      expect(result).not.toMatch(/<p[^>]*>\s*<\/p>/);
    });
  });

  describe('audit logging', () => {
    const cleaner = new Cleaner('standard');

    it('should log all removals with required fields', async () => {
      const html = '<article><p>42</p><p>ISBN 978-3-16-148410-0</p><p>Content</p></article>';
      const { auditLog } = await cleaner.process(html);

      expect(auditLog.length).toBeGreaterThan(0);
      for (const entry of auditLog) {
        expect(entry).toHaveProperty('type');
        expect(entry).toHaveProperty('pattern');
        expect(entry).toHaveProperty('contentRemoved');
        expect(entry).toHaveProperty('reason');
      }
    });

    it('should call onProgress callback', async () => {
      const progress: number[] = [];
      await cleaner.process('<article><p>test</p></article>', {
        onProgress: (pct) => progress.push(pct),
      });
      expect(progress[progress.length - 1]).toBe(100);
    });
  });
});

describe('detectRepeatedPatterns', () => {
  it('should detect patterns repeated >= minFrequency', () => {
    const html = `<article>
      <p>Header Text</p><p>Content 1</p>
      <p>Header Text</p><p>Content 2</p>
      <p>Header Text</p><p>Content 3</p>
      <p>Header Text</p><p>Content 4</p>
    </article>`;

    const patterns = detectRepeatedPatterns(html, 3);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].text).toBe('Header Text');
    expect(patterns[0].count).toBe(4);
  });

  it('should not detect patterns below threshold', () => {
    const html = '<article><p>Unique A</p><p>Unique B</p><p>Unique C</p></article>';
    const patterns = detectRepeatedPatterns(html, 3);
    expect(patterns.length).toBe(0);
  });

  it('should include confidence score', () => {
    const html = `<article>
      <p>Repeated</p><p>Other</p>
      <p>Repeated</p><p>Other2</p>
      <p>Repeated</p><p>Other3</p>
    </article>`;

    const patterns = detectRepeatedPatterns(html, 3);
    expect(patterns.length).toBe(1);
    expect(patterns[0].confidence).toBeGreaterThan(0);
    expect(patterns[0].confidence).toBeLessThanOrEqual(1);
  });

  it('should include positions', () => {
    const html = '<article><p>Rep</p><p>X</p><p>Rep</p><p>Y</p><p>Rep</p></article>';
    const patterns = detectRepeatedPatterns(html, 3);
    expect(patterns[0].positions.length).toBe(3);
  });
});

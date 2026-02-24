import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TxtExtractor } from '../../../src/extractors/txt.js';
import { validateStandardHtml } from '../../../src/core/standard-html.js';

describe('TxtExtractor', () => {
  const extractor = new TxtExtractor();

  it('should support .txt and .text extensions', () => {
    expect(extractor.canHandle('.txt')).toBe(true);
    expect(extractor.canHandle('.text')).toBe(true);
    expect(extractor.canHandle('.pdf')).toBe(false);
  });

  it('should extract simple text to StandardHTML', async () => {
    const input = Buffer.from('Hello world.\n\nSecond paragraph.');
    const result = await extractor.extract(input);

    expect(result.html).toContain('<article>');
    expect(result.html).toContain('<p>Hello world.</p>');
    expect(result.html).toContain('<p>Second paragraph.</p>');
    expect(result.metadata.sourceFormat).toBe('txt');
    expect(result.warnings).toEqual([]);
  });

  it('should produce valid StandardHTML', async () => {
    const input = Buffer.from('Paragraph one.\n\nParagraph two.');
    const result = await extractor.extract(input);

    const validation = validateStandardHtml(result.html);
    expect(validation.valid).toBe(true);
  });

  it('should escape HTML entities in text', async () => {
    const input = Buffer.from('Use <script> & "tags"');
    const result = await extractor.extract(input);

    expect(result.html).toContain('&lt;script&gt;');
    expect(result.html).toContain('&amp;');
    expect(result.html).not.toContain('<script>');
  });

  it('should handle empty input', async () => {
    const input = Buffer.from('');
    const result = await extractor.extract(input);

    expect(result.html).toContain('<article>');
    expect(result.metadata.sourceFormat).toBe('txt');
  });

  it('should use fileName from metadata', async () => {
    const input = Buffer.from('Hello');
    const result = await extractor.extract(input, {
      fileName: 'notes.txt',
      extension: '.txt',
      sizeBytes: 5,
    });

    expect(result.metadata.title).toBe('notes.txt');
  });

  it('should extract multiline fixture file', async () => {
    const fixture = readFileSync(resolve('test/fixtures/txt/multiline.txt'));
    const result = await extractor.extract(fixture);

    expect(result.html).toContain('<p>');
    const validation = validateStandardHtml(result.html);
    expect(validation.valid).toBe(true);
  });
});

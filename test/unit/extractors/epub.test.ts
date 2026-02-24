import { EpubExtractor } from '../../../src/extractors/epub.js';
import { ExtractionError } from '../../../src/core/errors.js';
import { validateStandardHtml } from '../../../src/core/standard-html.js';
import { createEpubBuffer } from '../../helpers/create-fixtures.js';

describe('EpubExtractor', () => {
  const extractor = new EpubExtractor();

  it('should support .epub extension', () => {
    expect(extractor.canHandle('.epub')).toBe(true);
    expect(extractor.canHandle('.pdf')).toBe(false);
  });

  it('should detect EPUB by ZIP magic bytes', () => {
    const zipBuffer = Buffer.from('PK\x03\x04test');
    expect(extractor.canHandle('.unknown', zipBuffer)).toBe(true);
  });

  it('should extract single chapter EPUB', async () => {
    const epub = await createEpubBuffer({
      title: 'Simple Book',
      author: 'Jane Doe',
      chapters: [{ title: 'Chapter 1', body: '<p>Hello from chapter one.</p>' }],
    });

    const result = await extractor.extract(epub);

    expect(result.html).toContain('<article>');
    expect(result.html).toContain('Hello from chapter one.');
    expect(result.metadata.title).toBe('Simple Book');
    expect(result.metadata.author).toBe('Jane Doe');
    expect(result.metadata.language).toBe('en');
    expect(result.metadata.sourceFormat).toBe('epub');
  });

  it('should respect spine order for multi-chapter EPUB', async () => {
    const epub = await createEpubBuffer({
      chapters: [
        { title: 'First', body: '<p>Content A</p>' },
        { title: 'Second', body: '<p>Content B</p>' },
        { title: 'Third', body: '<p>Content C</p>' },
      ],
    });

    const result = await extractor.extract(epub);

    const indexA = result.html.indexOf('Content A');
    const indexB = result.html.indexOf('Content B');
    const indexC = result.html.indexOf('Content C');

    expect(indexA).toBeLessThan(indexB);
    expect(indexB).toBeLessThan(indexC);
  });

  it('should produce valid StandardHTML', async () => {
    const epub = await createEpubBuffer({
      chapters: [{ title: 'Test', body: '<p>Valid content</p>' }],
    });

    const result = await extractor.extract(epub);
    const validation = validateStandardHtml(result.html);
    expect(validation.valid).toBe(true);
  });

  it('should strip scripts and styles from XHTML', async () => {
    const epub = await createEpubBuffer({
      chapters: [
        {
          title: 'Styled',
          body: '<p style="color:red" class="fancy">Text</p><script>alert(1)</script>',
        },
      ],
    });

    const result = await extractor.extract(epub);

    expect(result.html).not.toContain('<script>');
    expect(result.html).not.toContain('style=');
    expect(result.html).not.toContain('class=');
    expect(result.html).toContain('Text');
  });

  it('should throw ExtractionError for invalid EPUB', async () => {
    const invalidBuffer = Buffer.from('not an epub');
    await expect(extractor.extract(invalidBuffer)).rejects.toThrow(ExtractionError);
  });

  it('should use sections to wrap chapters', async () => {
    const epub = await createEpubBuffer({
      chapters: [
        { title: 'Ch1', body: '<p>One</p>' },
        { title: 'Ch2', body: '<p>Two</p>' },
      ],
    });

    const result = await extractor.extract(epub);
    const sectionCount = (result.html.match(/<section>/g) || []).length;
    expect(sectionCount).toBe(2);
  });
});

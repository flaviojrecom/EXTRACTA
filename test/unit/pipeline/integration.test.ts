import { Normalizer } from '../../../src/pipeline/normalizer.js';
import { Cleaner } from '../../../src/pipeline/cleaner.js';
import { TxtExtractor } from '../../../src/extractors/txt.js';
import { validateStandardHtml } from '../../../src/core/standard-html.js';

describe('Pipeline Integration: Extract → Normalize → Clean', () => {
  const txtExtractor = new TxtExtractor();
  const normalizer = new Normalizer();

  it('should process TXT through full pipeline (light)', async () => {
    const input = Buffer.from(
      'This is the first paragraph.\n\nPage 42\n\nThis is the second paragraph.\n\n- 43 -',
    );

    const extraction = await txtExtractor.extract(input);
    const normalized = await normalizer.process(extraction.html);
    const cleaner = new Cleaner('light');
    const { html, auditLog } = await cleaner.process(normalized);

    expect(html).toContain('first paragraph');
    expect(html).toContain('second paragraph');
    expect(html).not.toContain('Page 42');

    const validation = validateStandardHtml(html);
    expect(validation.valid).toBe(true);
    expect(auditLog.length).toBeGreaterThan(0);
  });

  it('should process noisy text through standard cleaning', async () => {
    const input = Buffer.from(
      'Chapter 1\n\nThe story begins here with develop-\nment of a new system.\n\n' +
        'Copyright 2024 Author\n\n' +
        'ISBN 978-0-13-468599-1\n\n' +
        'All rights reserved by the publisher.\n\n' +
        'The main content continues with \u201Csmart quotes\u201D and em\u2014dashes.\n\n' +
        '42',
    );

    const extraction = await txtExtractor.extract(input);
    const normalized = await normalizer.process(extraction.html);
    const cleaner = new Cleaner('standard');
    const { html } = await cleaner.process(normalized);

    // Normalizer should have fixed
    expect(html).toContain('development');
    expect(html).toContain('"smart quotes"');
    expect(html).toContain('em-dashes');

    // Cleaner should have removed
    expect(html).not.toContain('Copyright');
    expect(html).not.toContain('ISBN');
    expect(html).not.toContain('All rights reserved');

    // Content should remain
    expect(html).toContain('Chapter 1');
    expect(html).toContain('story begins');

    const validation = validateStandardHtml(html);
    expect(validation.valid).toBe(true);
  });

  it('should handle empty document gracefully', async () => {
    const input = Buffer.from('');
    const extraction = await txtExtractor.extract(input);
    const normalized = await normalizer.process(extraction.html);
    const cleaner = new Cleaner('standard');
    const { html } = await cleaner.process(normalized);

    expect(html).toContain('<article>');
    const validation = validateStandardHtml(html);
    expect(validation.valid).toBe(true);
  });
});

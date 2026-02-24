import * as cheerio from 'cheerio';
import type { IPipelineStage, StageOptions } from '../core/types.js';
import type { StructuredDocument, Section, SectionMetadata, QualityIndicators } from '../core/document.js';
import type { DocumentMetadata } from '../extractors/types.js';
import { detectHeadings, type DetectedHeading } from './heading-detector.js';
import { htmlToMarkdown } from './markdown-generator.js';
import { detectLanguage } from './language-detector.js';

export class StructureBuilder implements IPipelineStage<string, StructuredDocument> {
  name = 'structure';

  private existingMetadata?: DocumentMetadata;

  constructor(metadata?: DocumentMetadata) {
    this.existingMetadata = metadata;
  }

  async process(input: string, options?: StageOptions): Promise<StructuredDocument> {
    options?.onProgress?.(0, 'Detecting headings');

    const headings = detectHeadings(input);

    options?.onProgress?.(20, `Found ${headings.length} headings`);

    const sections = this.buildHierarchy(input, headings);

    options?.onProgress?.(50, 'Building section metadata');

    this.enrichMetadata(sections);

    const docMetadata = this.extractDocumentMetadata(input, sections);

    options?.onProgress?.(80, 'Computing quality indicators');

    const qualityIndicators = this.computeQuality(sections, headings, docMetadata);

    options?.onProgress?.(100, 'Structure complete');

    return {
      metadata: docMetadata,
      sections,
      qualityIndicators,
    };
  }

  private buildHierarchy(html: string, headings: DetectedHeading[]): Section[] {
    if (headings.length === 0) {
      // Graceful degradation: single section for flat documents
      const markdown = htmlToMarkdown(html);
      return [
        {
          id: 'ch1',
          level: 1,
          title: 'Document',
          content: markdown,
          children: [],
          meta: this.computeSectionMeta(markdown),
        },
      ];
    }

    const $ = cheerio.load(html, { xml: true });
    const root = $.html() || html;

    // Split content by heading positions
    const parts = this.splitByHeadings(root, headings);

    // Build tree from flat list
    return this.buildTree(parts);
  }

  private splitByHeadings(
    html: string,
    headings: DetectedHeading[],
  ): { heading: DetectedHeading; content: string }[] {
    const parts: { heading: DetectedHeading; content: string }[] = [];

    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].position;
      const end = i + 1 < headings.length ? headings[i + 1].position : html.length;

      // Extract content between this heading and the next
      const rawContent = html.substring(start, end);

      // Remove the heading tag itself from content
      const headingTagRegex = new RegExp(
        `<h[1-6][^>]*>.*?</h[1-6]>|<p[^>]*>${escapeRegex(headings[i].text)}</p>`,
        'i',
      );
      const content = rawContent.replace(headingTagRegex, '').trim();

      parts.push({ heading: headings[i], content });
    }

    return parts;
  }

  private buildTree(
    parts: { heading: DetectedHeading; content: string }[],
  ): Section[] {
    const root: Section[] = [];
    const stack: { section: Section; level: number }[] = [];
    const chapterCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (const part of parts) {
      const level = Math.min(part.heading.level, 6);
      chapterCounts[level]++;

      // Reset sub-level counters
      for (let i = level + 1; i <= 6; i++) chapterCounts[i] = 0;

      const id = this.generateId(level, chapterCounts);
      const markdown = htmlToMarkdown(part.content);

      const section: Section = {
        id,
        level,
        title: part.heading.text,
        content: markdown,
        children: [],
        meta: this.computeSectionMeta(markdown, part.heading.text),
      };

      // Find parent: pop stack until we find a section with lower level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].section.children.push(section);
      } else {
        root.push(section);
      }

      stack.push({ section, level });
    }

    return root;
  }

  private generateId(level: number, counts: number[]): string {
    const parts: string[] = [];
    const prefixes = ['', 'ch', 's', 'ss', 'p', 'sp', 'ssp'];

    for (let i = 1; i <= level; i++) {
      if (counts[i] > 0) {
        parts.push(`${prefixes[i] || 'l' + i}${counts[i]}`);
      }
    }

    return parts.join('-') || 'ch1';
  }

  private computeSectionMeta(markdown: string, title?: string): SectionMetadata {
    const plainText = markdown.replace(/[#*`>\-|[\]()]/g, '').trim();
    const words = plainText.split(/\s+/).filter((w) => w.length > 0);

    return {
      chapter: title,
      wordCount: words.length,
      charCount: plainText.length,
    };
  }

  private enrichMetadata(sections: Section[]): void {
    const walk = (items: Section[], chapterTitle?: string) => {
      for (const s of items) {
        if (s.level === 1) {
          s.meta.chapter = s.title;
        } else if (chapterTitle) {
          s.meta.chapter = chapterTitle;
        }
        if (s.level === 2) {
          s.meta.section = s.title;
        }
        walk(s.children, s.level === 1 ? s.title : chapterTitle);
      }
    };
    walk(sections);
  }

  private extractDocumentMetadata(html: string, sections: Section[]): DocumentMetadata {
    const language = detectLanguage(html);

    // Title: use existing metadata or first heading
    const title =
      this.existingMetadata?.title ||
      (sections.length > 0 ? sections[0].title : undefined);

    // Author: check existing metadata or search for "by Author" pattern
    let author = this.existingMetadata?.author;
    if (!author) {
      const byMatch = html.match(/(?:by|por|author:\s*)([^<]{2,50})/i);
      if (byMatch) author = byMatch[1].trim();
    }

    return {
      title,
      author,
      language: language.language !== 'unknown' ? language.language : this.existingMetadata?.language,
      sourceFormat: this.existingMetadata?.sourceFormat || 'unknown',
      pageCount: this.existingMetadata?.pageCount,
    };
  }

  private computeQuality(
    sections: Section[],
    headings: DetectedHeading[],
    metadata: DocumentMetadata,
  ): QualityIndicators {
    // Structure preserved: based on heading detection confidence
    const avgConfidence =
      headings.length > 0
        ? headings.reduce((sum, h) => sum + h.confidence, 0) / headings.length
        : 0.3; // flat document baseline
    const structurePreserved = Math.round(avgConfidence * 100);

    // Noise removed: placeholder (set by cleaner in previous stage)
    const noiseRemoved = 50;

    // Metadata completeness
    let metaFields = 0;
    if (metadata.title) metaFields++;
    if (metadata.author) metaFields++;
    if (metadata.language) metaFields++;
    if (metadata.sourceFormat && metadata.sourceFormat !== 'unknown') metaFields++;
    const metadataCompleteness = Math.round((metaFields / 4) * 100);

    return { structurePreserved, noiseRemoved, metadataCompleteness };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

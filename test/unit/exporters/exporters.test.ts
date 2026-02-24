import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { StructuredDocument } from '../../../src/core/document.js';
import type { Chunk } from '../../../src/chunker/types.js';
import { MarkdownExporter } from '../../../src/exporters/markdown.js';
import { JsonExporter } from '../../../src/exporters/json.js';
import { JsonlExporter } from '../../../src/exporters/jsonl.js';
import { PlainTextExporter } from '../../../src/exporters/plain-text.js';

const makeDoc = (): StructuredDocument => ({
  metadata: { title: 'Test Doc', author: 'Author', language: 'en', sourceFormat: 'txt' },
  sections: [
    {
      id: 'ch1', level: 1, title: 'Chapter One', content: '# Chapter One\n\nHello **world**.',
      children: [
        { id: 'ch1-s1', level: 2, title: 'Section A', content: '## Section A\n\nDetails here.', children: [], meta: { wordCount: 2, charCount: 12 } },
      ],
      meta: { wordCount: 2, charCount: 14, chapter: 'Chapter One' },
    },
  ],
  qualityIndicators: { structurePreserved: 80, noiseRemoved: 50, metadataCompleteness: 75 },
});

const makeChunks = (): Chunk[] => [
  { id: 'chunk-001', content: 'Hello world.', metadata: { chunkId: 'chunk-001', chapterTitle: 'Chapter One', sectionTitle: undefined, tokenCount: 5, overlapTokens: 0, position: { index: 0, total: 2 } } },
  { id: 'chunk-002', content: 'Details here.', metadata: { chunkId: 'chunk-002', chapterTitle: 'Chapter One', sectionTitle: 'Section A', tokenCount: 4, overlapTokens: 1, position: { index: 1, total: 2 } } },
];

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'extracta-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('MarkdownExporter', () => {
  it('should export to .md file', async () => {
    const exporter = new MarkdownExporter();
    const result = await exporter.export(makeDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: true });
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatch(/\.md$/);
    const content = readFileSync(result.files[0], 'utf-8');
    expect(content).toContain('Test Doc');
    expect(content).toContain('author: Author');
  });

  it('should skip metadata block when includeMetadata is false', async () => {
    const exporter = new MarkdownExporter();
    const result = await exporter.export(makeDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: false });
    const content = readFileSync(result.files[0], 'utf-8');
    expect(content).not.toContain('author:');
  });
});

describe('JsonExporter', () => {
  it('should export to .json file with chunks', async () => {
    const exporter = new JsonExporter();
    const result = await exporter.export(makeDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: true });
    expect(result.files[0]).toMatch(/\.json$/);
    const data = JSON.parse(readFileSync(result.files[0], 'utf-8'));
    expect(data.metadata.title).toBe('Test Doc');
    expect(data.chunks).toHaveLength(2);
    expect(data.sections).toBeDefined();
  });
});

describe('JsonlExporter', () => {
  it('should export to .jsonl with one line per chunk', async () => {
    const exporter = new JsonlExporter();
    const result = await exporter.export(makeDoc(), makeChunks(), { outputDir: tmpDir, preset: 'fine-tuning', includeMetadata: true });
    expect(result.files[0]).toMatch(/\.jsonl$/);
    const lines = readFileSync(result.files[0], 'utf-8').trim().split('\n');
    expect(lines).toHaveLength(2);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.text).toBe('Hello world.');
    expect(parsed.chunk_id).toBe('chunk-001');
  });
});

describe('PlainTextExporter', () => {
  it('should export to .txt without markdown formatting', async () => {
    const exporter = new PlainTextExporter();
    const result = await exporter.export(makeDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: false });
    expect(result.files[0]).toMatch(/\.txt$/);
    const content = readFileSync(result.files[0], 'utf-8');
    expect(content).not.toContain('#');
    expect(content).not.toContain('**');
    expect(content).toContain('world');
  });
});

const makeOcrDoc = (): StructuredDocument => ({
  metadata: {
    title: 'Scanned Doc', sourceFormat: 'pdf',
    isScanned: true, ocrConfidence: 78.5, ocrEngine: 'tesseract',
    lowConfidencePages: [3, 7],
  },
  sections: [
    {
      id: 'ch1', level: 1, title: 'Page 1', content: 'OCR extracted text.',
      children: [], meta: { wordCount: 3, charCount: 19 },
    },
  ],
  qualityIndicators: { structurePreserved: 50, noiseRemoved: 40, metadataCompleteness: 60 },
});

describe('MarkdownExporter OCR provenance', () => {
  it('should include OCR provenance note for scanned docs', async () => {
    const exporter = new MarkdownExporter();
    const result = await exporter.export(makeOcrDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: true });
    const content = readFileSync(result.files[0], 'utf-8');
    expect(content).toContain('Extracted via OCR');
    expect(content).toContain('tesseract');
    expect(content).toContain('78.5');
  });
});

describe('JsonExporter OCR provenance', () => {
  it('should include ocr block for scanned docs', async () => {
    const exporter = new JsonExporter();
    const result = await exporter.export(makeOcrDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: true });
    const data = JSON.parse(readFileSync(result.files[0], 'utf-8'));
    expect(data.ocr).toBeDefined();
    expect(data.ocr.engine).toBe('tesseract');
    expect(data.ocr.confidence).toBe(78.5);
    expect(data.ocr.lowConfidencePages).toEqual([3, 7]);
  });
});

describe('JsonlExporter OCR provenance', () => {
  it('should include ocr_confidence per chunk for scanned docs', async () => {
    const exporter = new JsonlExporter();
    const result = await exporter.export(makeOcrDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: true });
    const lines = readFileSync(result.files[0], 'utf-8').trim().split('\n');
    const parsed = JSON.parse(lines[0]);
    expect(parsed.ocr_confidence).toBe(78.5);
  });
});

describe('PlainTextExporter OCR provenance', () => {
  it('should include OCR provenance header for scanned docs', async () => {
    const exporter = new PlainTextExporter();
    const result = await exporter.export(makeOcrDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: false });
    const content = readFileSync(result.files[0], 'utf-8');
    expect(content).toContain('Extracted via OCR');
    expect(content).toContain('tesseract');
  });
});

describe('Export stats', () => {
  it('should include correct stats in result', async () => {
    const exporter = new JsonExporter();
    const result = await exporter.export(makeDoc(), makeChunks(), { outputDir: tmpDir, preset: 'rag', includeMetadata: true });
    expect(result.stats.totalChunks).toBe(2);
    expect(result.stats.totalTokens).toBe(9);
    expect(result.stats.avgChunkSize).toBeGreaterThan(0);
    expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0);
  });
});

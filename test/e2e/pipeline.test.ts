import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PipelineRunner, type PipelineConfig } from '../../src/pipeline/runner.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'extracta-e2e-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function makeConfig(preset: PipelineConfig['preset'], outputDir: string): PipelineConfig {
  const cleaningMap = { 'knowledge-base': 'light' as const, 'rag': 'standard' as const, 'fine-tuning': 'aggressive' as const };
  const formatMap = { 'knowledge-base': ['md'] as const, 'rag': ['json'] as const, 'fine-tuning': ['jsonl'] as const };
  return {
    cleaningLevel: cleaningMap[preset],
    chunkOptions: { minTokens: 50, maxTokens: 500, targetTokens: 200, overlapStrategy: 'semantic', preserveStructures: true },
    exportFormats: [...formatMap[preset]],
    preset,
    cache: false,
    verbose: false,
    outputDir,
  };
}

describe('E2E Pipeline', () => {
  it('should process a TXT file end-to-end with rag preset', async () => {
    const txtFile = join(tmpDir, 'test.txt');
    writeFileSync(txtFile, 'Chapter 1: Introduction\n\nThis is the introduction to our document. It contains several sentences of text for testing. The pipeline should handle this correctly.\n\nChapter 2: Details\n\nHere are the details of the implementation. We have multiple paragraphs to ensure chunking works properly.');
    const outputDir = join(tmpDir, 'output');
    const config = makeConfig('rag', outputDir);
    const runner = new PipelineRunner(config);
    const result = await runner.run(txtFile);

    expect(result.document.sections.length).toBeGreaterThan(0);
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.qualityScore.overall).toBeGreaterThanOrEqual(0);
    expect(result.exportResults.length).toBe(1);
    expect(existsSync(result.exportResults[0].files[0])).toBe(true);

    const json = JSON.parse(readFileSync(result.exportResults[0].files[0], 'utf-8'));
    expect(json.metadata).toBeDefined();
    expect(json.chunks).toBeDefined();
  }, 15000);

  it('should process a TXT file with knowledge-base preset (md export)', async () => {
    const txtFile = join(tmpDir, 'kb.txt');
    writeFileSync(txtFile, 'My Document Title\n\nSome content here about the topic.\n\nMore content in another paragraph.');
    const outputDir = join(tmpDir, 'output-kb');
    const config = makeConfig('knowledge-base', outputDir);
    const runner = new PipelineRunner(config);
    const result = await runner.run(txtFile);

    expect(result.exportResults.length).toBe(1);
    const content = readFileSync(result.exportResults[0].files[0], 'utf-8');
    expect(content).toContain('content');
  }, 15000);

  it('should process a TXT file with fine-tuning preset (jsonl export)', async () => {
    const txtFile = join(tmpDir, 'ft.txt');
    writeFileSync(txtFile, 'Training Data\n\nFirst example sentence for fine tuning. Second example here.\n\nAnother paragraph of training data.');
    const outputDir = join(tmpDir, 'output-ft');
    const config = makeConfig('fine-tuning', outputDir);
    const runner = new PipelineRunner(config);
    const result = await runner.run(txtFile);

    expect(result.exportResults.length).toBe(1);
    const lines = readFileSync(result.exportResults[0].files[0], 'utf-8').trim().split('\n');
    expect(lines.length).toBeGreaterThan(0);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.text).toBeDefined();
    expect(parsed.chunk_id).toBeDefined();
  }, 15000);

  it('should process PDF files end-to-end', async () => {
    const pdfPath = join(process.cwd(), 'test/fixtures/pdf/simple.pdf');
    if (!existsSync(pdfPath)) return; // Skip if fixture missing
    const outputDir = join(tmpDir, 'output-pdf');
    const config = makeConfig('rag', outputDir);
    const runner = new PipelineRunner(config);
    const result = await runner.run(pdfPath);

    expect(result.document).toBeDefined();
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.exportResults.length).toBe(1);
  }, 15000);

  it('should support multiple export formats', async () => {
    const txtFile = join(tmpDir, 'multi.txt');
    writeFileSync(txtFile, 'Multi Format Test\n\nContent for testing multiple export formats at once.');
    const outputDir = join(tmpDir, 'output-multi');
    const config = makeConfig('rag', outputDir);
    config.exportFormats = ['md', 'json', 'txt'];
    const runner = new PipelineRunner(config);
    const result = await runner.run(txtFile);

    expect(result.exportResults.length).toBe(3);
    const extensions = result.exportResults.flatMap(r => r.files).map(f => f.split('.').pop());
    expect(extensions).toContain('md');
    expect(extensions).toContain('json');
    expect(extensions).toContain('txt');
  }, 15000);
});

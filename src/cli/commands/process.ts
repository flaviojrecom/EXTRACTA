import { Command } from 'commander';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve, extname, basename } from 'node:path';
import { PipelineRunner } from '../../pipeline/runner.js';
import type { PipelineConfig, ProgressCallback } from '../../pipeline/runner.js';
import type { Preset, ExportFormat } from '../../exporters/types.js';

const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.epub', '.txt']);

const PRESET_DEFAULTS: Record<Preset, { cleaningLevel: PipelineConfig['cleaningLevel']; formats: ExportFormat[] }> = {
  'knowledge-base': { cleaningLevel: 'light', formats: ['md'] },
  'rag': { cleaningLevel: 'standard', formats: ['json'] },
  'fine-tuning': { cleaningLevel: 'aggressive', formats: ['jsonl'] },
};

export function registerProcessCommand(program: Command): void {
  program
    .command('process')
    .description('Process a document through the EXTRACTA pipeline')
    .argument('<file>', 'Path to the input file or directory')
    .option('--preset <preset>', 'Processing preset (knowledge-base, rag, fine-tuning)', 'rag')
    .option('--format <formats>', 'Output formats (comma-separated: md,json,jsonl,txt)')
    .option('--output <dir>', 'Output directory', './output')
    .option('--chunk-size <number>', 'Target chunk size in tokens', '750')
    .option('--no-cache', 'Disable caching')
    .option('--verbose', 'Enable verbose output', false)
    .option('--dry-run', 'Analyze without exporting', false)
    .action(async (file: string, options: Record<string, unknown>) => {
      try {
        const filePath = resolve(file as string);
        if (!existsSync(filePath)) {
          console.error(`Error: File or directory not found: ${filePath}`);
          process.exitCode = 1;
          return;
        }

        const preset = options['preset'] as Preset;
        const presetDefaults = PRESET_DEFAULTS[preset];
        if (!presetDefaults) {
          console.error(`Error: Invalid preset "${preset}". Use: knowledge-base, rag, fine-tuning`);
          process.exitCode = 1;
          return;
        }

        const formats = options['format']
          ? (options['format'] as string).split(',') as ExportFormat[]
          : presetDefaults.formats;
        const outputDir = resolve(options['output'] as string);
        const chunkSize = parseInt(options['chunkSize'] as string, 10);
        const cache = options['cache'] as boolean;
        const verbose = options['verbose'] as boolean;
        const dryRun = options['dryRun'] as boolean;

        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          // Batch mode
          await processBatch(filePath, { preset, formats, outputDir, chunkSize, cache, verbose, dryRun });
        } else {
          await processSingleFile(filePath, { preset, formats, outputDir, chunkSize, cache, verbose, dryRun });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${msg}`);
        process.exitCode = 1;
      }
    });
}

interface ProcessOptions {
  preset: Preset;
  formats: ExportFormat[];
  outputDir: string;
  chunkSize: number;
  cache: boolean;
  verbose: boolean;
  dryRun: boolean;
}

async function processSingleFile(filePath: string, opts: ProcessOptions): Promise<void> {
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    console.error(`Error: Unsupported format "${ext}". Supported: ${[...SUPPORTED_EXTENSIONS].join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const presetDefaults = PRESET_DEFAULTS[opts.preset];
  const isTty = process.stdout.isTTY;

  const config: PipelineConfig = {
    cleaningLevel: presetDefaults.cleaningLevel,
    chunkOptions: {
      minTokens: 500,
      maxTokens: 1000,
      targetTokens: opts.chunkSize,
      overlapStrategy: 'semantic',
      preserveStructures: true,
    },
    exportFormats: opts.dryRun ? [] : opts.formats,
    preset: opts.preset,
    cache: opts.cache,
    verbose: opts.verbose,
    outputDir: opts.outputDir,
  };

  const startTime = Date.now();
  const progressFn: ProgressCallback | undefined = isTty
    ? (stage, step, total, msg) => {
        const pct = Math.round((step / total) * 100);
        process.stdout.write(`\r[${step}/${total}] ${capitalize(stage)}${msg ? ': ' + msg : ''}... ${pct}%   `);
      }
    : opts.verbose
      ? (stage, step, total, msg) => {
          console.log(`[${step}/${total}] ${capitalize(stage)}${msg ? ': ' + msg : ''}`);
        }
      : undefined;

  const runner = new PipelineRunner(config);
  const result = await runner.run(filePath, progressFn);

  if (isTty) process.stdout.write('\r' + ' '.repeat(80) + '\r');

  const elapsed = Date.now() - startTime;

  if (opts.dryRun) {
    console.log(`\nDry run analysis for: ${basename(filePath)}`);
    console.log(`  Sections: ${result.document.sections.length}`);
    console.log(`  Chunks: ${result.chunks.length}`);
    console.log(`  Language: ${result.document.metadata.language ?? 'unknown'}`);
    console.log(`  Quality: ${result.qualityScore.overall}/100`);
    console.log(`    Structure: ${result.qualityScore.structureScore}/100`);
    console.log(`    Chunks: ${result.qualityScore.chunkConsistencyScore}/100`);
    console.log(`    Metadata: ${result.qualityScore.metadataScore}/100`);
    console.log(`  Time: ${elapsed}ms`);
    return;
  }

  // Summary
  console.log(`\n✓ ${basename(filePath)} processed in ${elapsed}ms`);
  console.log(`  Quality: ${result.qualityScore.overall}/100`);
  for (const er of result.exportResults) {
    for (const f of er.files) {
      console.log(`  Output: ${f}`);
    }
  }

  if (opts.verbose) {
    console.log(`  Sections: ${result.document.sections.length}`);
    console.log(`  Chunks: ${result.chunks.length}`);
    console.log(`  Cleaner removals: ${result.cleanerAuditLog.length}`);
    console.log(`  Quality breakdown:`);
    console.log(`    Structure: ${result.qualityScore.structureScore}/100`);
    console.log(`    Chunk consistency: ${result.qualityScore.chunkConsistencyScore}/100`);
    console.log(`    Metadata: ${result.qualityScore.metadataScore}/100`);
  }
}

async function processBatch(dirPath: string, opts: ProcessOptions): Promise<void> {
  const files = readdirSync(dirPath)
    .filter((f) => SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase()))
    .map((f) => join(dirPath, f));

  if (files.length === 0) {
    console.log(`No supported files found in: ${dirPath}`);
    return;
  }

  console.log(`Found ${files.length} file(s) to process:`);
  for (const f of files) console.log(`  - ${basename(f)}`);
  console.log('');

  let success = 0;
  let failures = 0;
  const startTime = Date.now();

  for (const filePath of files) {
    const fileOutputDir = join(opts.outputDir, basename(filePath, extname(filePath)));
    try {
      await processSingleFile(filePath, { ...opts, outputDir: fileOutputDir });
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${basename(filePath)}: ${msg}`);
      failures++;
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`\nBatch complete: ${success} succeeded, ${failures} failed in ${elapsed}ms`);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

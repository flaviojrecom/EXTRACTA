import { Command } from 'commander';
import { PipelineRunner } from '../../pipeline/runner.js';
import type { PipelineConfig } from '../../pipeline/runner.js';
import type { Preset, ExportFormat } from '../../exporters/types.js';

export function registerProcessCommand(program: Command): void {
  program
    .command('process')
    .description('Process a document through the EXTRACTA pipeline')
    .argument('<file>', 'Path to the input file (PDF, EPUB, or TXT)')
    .option(
      '--preset <preset>',
      'Processing preset',
      'rag',
    )
    .option('--format <formats>', 'Output formats (comma-separated)', 'md')
    .option('--output <dir>', 'Output directory', './output')
    .option('--chunk-size <number>', 'Target chunk size in tokens', '750')
    .option('--no-cache', 'Disable caching')
    .option('--verbose', 'Enable verbose output', false)
    .option('--dry-run', 'Show what would be done without executing', false)
    .action(async (file: string, options: Record<string, unknown>) => {
      const preset = options['preset'] as Preset;
      const formats = (options['format'] as string).split(',') as ExportFormat[];
      const outputDir = options['output'] as string;
      const chunkSize = parseInt(options['chunkSize'] as string, 10);
      const cache = options['cache'] as boolean;
      const verbose = options['verbose'] as boolean;
      const dryRun = options['dryRun'] as boolean;

      if (verbose || dryRun) {
        console.log(`Processing: ${file}`);
        console.log(`  Preset: ${preset}`);
        console.log(`  Formats: ${formats.join(', ')}`);
        console.log(`  Output: ${outputDir}`);
        console.log(`  Chunk size: ${chunkSize}`);
        console.log(`  Cache: ${cache}`);
      }

      if (dryRun) {
        console.log('Dry run complete. No files were processed.');
        return;
      }

      const cleaningLevelMap: Record<Preset, PipelineConfig['cleaningLevel']> = {
        'knowledge-base': 'light',
        'rag': 'standard',
        'fine-tuning': 'aggressive',
      };

      const config: PipelineConfig = {
        cleaningLevel: cleaningLevelMap[preset],
        chunkOptions: {
          minTokens: 500,
          maxTokens: 1000,
          targetTokens: chunkSize,
          overlapStrategy: 'semantic',
          preserveStructures: true,
        },
        exportFormats: formats,
        preset,
        cache,
        verbose,
      };

      const runner = new PipelineRunner(config);
      console.log(`Processing: ${file}`);
      await runner.run(file);
    });
}

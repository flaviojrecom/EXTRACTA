export const config = {
  api: { bodyParser: false },
};

// Allow large file uploads (scanned PDFs can be 100MB+)
export const maxDuration = 300; // 5 minutes

import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { PipelineRunner } from '@extracta/pipeline/runner';
import type { PipelineConfig } from '@extracta/pipeline/runner';
import type { ExportFormat, Preset } from '@extracta/exporters/types';
import type { CleaningLevel } from '@extracta/pipeline/cleaner';

const PRESET_DEFAULTS: Record<string, { cleaningLevel: CleaningLevel; formats: ExportFormat[] }> = {
  raw: { cleaningLevel: 'light', formats: ['md', 'txt'] },
  'knowledge-base': { cleaningLevel: 'light', formats: ['md'] },
  rag: { cleaningLevel: 'standard', formats: ['json'] },
  'fine-tuning': { cleaningLevel: 'aggressive', formats: ['jsonl'] },
};

const SUPPORTED_EXTENSIONS = ['.pdf', '.epub', '.txt', '.html', '.htm', '.rtf', '.mobi', '.azw', '.azw3'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const preset = (formData.get('preset') as Preset) || 'raw';
  const formats = formData.get('formats') as string | null;

  // Validation (return JSON for errors — no SSE needed)
  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File too large (max 500MB)' }, { status: 400 });
  }
  const ext = extname(file.name).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return Response.json(
      { error: `Unsupported format: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}` },
      { status: 400 },
    );
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const presetDefaults = PRESET_DEFAULTS[preset] || PRESET_DEFAULTS.rag;
        const exportFormats: ExportFormat[] = formats
          ? (formats.split(',') as ExportFormat[])
          : ['md', 'json', 'jsonl', 'txt'];

        // Save to temp directory
        const sessionId = randomUUID();
        const tmpBase = join(tmpdir(), 'extracta', sessionId);
        mkdirSync(tmpBase, { recursive: true });
        const tmpPath = join(tmpBase, `upload${ext}`);
        const outputDir = join(tmpBase, 'output');
        mkdirSync(outputDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        writeFileSync(tmpPath, buffer);

        // Build config
        const config: PipelineConfig = {
          cleaningLevel: presetDefaults.cleaningLevel,
          chunkOptions: {
            minTokens: 100,
            maxTokens: 1500,
            targetTokens: 750,
            overlapStrategy: preset === 'rag' ? 'semantic' : 'fixed',
            preserveStructures: true,
          },
          exportFormats,
          preset,
          cache: false,
          verbose: false,
          outputDir,
        };

        // Run pipeline with progress callback
        const runner = new PipelineRunner(config);
        const result = await runner.run(tmpPath, (stage, step, total, message) => {
          send('progress', { stage, step, total, message: message || '' });
        });

        // Cleanup temp upload file
        try { unlinkSync(tmpPath); } catch { /* ignore */ }

        // Send final result
        send('result', {
          sessionId,
          fileName: file.name,
          metadata: result.document.metadata,
          sectionsCount: result.document.sections.length,
          chunksCount: result.chunks.length,
          quality: {
            overall: result.qualityScore.overall,
            breakdown: {
              structure: result.qualityScore.structureScore,
              chunkConsistency: result.qualityScore.chunkConsistencyScore,
              metadata: result.qualityScore.metadataScore,
            },
          },
          preview: result.chunks.slice(0, 5).map((c) => ({
            id: c.id,
            content: c.content.slice(0, 200),
            tokens: c.metadata.tokenCount,
          })),
          files: result.exportResults.flatMap((r) =>
            r.files.map((f) => ({
              path: f.split('/').pop(),
              format: f.split('.').pop(),
            })),
          ),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Processing failed';
        send('error', { error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

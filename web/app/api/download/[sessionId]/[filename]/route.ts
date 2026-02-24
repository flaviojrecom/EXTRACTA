import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string; filename: string }> },
) {
  const { sessionId, filename } = await params;

  // Validate sessionId format (UUID)
  if (!/^[a-f0-9-]{36}$/.test(sessionId)) {
    return Response.json({ error: 'Invalid session' }, { status: 400 });
  }

  const filePath = join(tmpdir(), 'extracta', sessionId, 'output', filename);

  if (!existsSync(filePath)) {
    return Response.json({ error: 'File not found' }, { status: 404 });
  }

  const content = readFileSync(filePath);
  const ext = filename.split('.').pop() || 'txt';

  const mimeTypes: Record<string, string> = {
    json: 'application/json',
    jsonl: 'application/x-ndjson',
    md: 'text/markdown',
    txt: 'text/plain',
  };

  return new Response(content, {
    headers: {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

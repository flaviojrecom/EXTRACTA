'use client';

import { useState, useCallback, useRef } from 'react';
import { Logo } from '../components/Logo';
import { FlagButton } from '../components/FlagButton';
import { UploadIcon } from '../components/UploadIcon';
import { FileIcon } from '../components/FileIcon';

type Preset = 'rag' | 'knowledge-base' | 'fine-tuning';
type Lang = 'en' | 'pt';

interface ProcessResult {
  sessionId: string;
  fileName: string;
  metadata: { title?: string; author?: string; language?: string };
  sectionsCount: number;
  chunksCount: number;
  quality: {
    overall: number;
    breakdown: { structure: number; chunkConsistency: number; metadata: number };
  };
  preview: { id: string; content: string; tokens: number }[];
  files: { path: string; format: string }[];
}

// ─── i18n ────────────────────────────────────────────────
const T: Record<Lang, Record<string, string>> = {
  en: {
    tagline: 'AI-Powered Knowledge Extraction',
    subtitle: 'Transform documents into AI-ready knowledge',
    dropHere: 'Drag & drop your document here',
    dropHint: 'or click to browse files',
    dropFormats: 'Supports PDF, EPUB, MOBI, AZW, RTF, HTML, TXT — max 500MB',
    dropReplace: 'Click or drop to replace',
    presetHint: 'Select a processing mode — each adjusts cleaning, chunking, and output format',
    process: 'Process Document',
    processing: 'Processing...',
    pipeline: 'Running extraction pipeline...',
    connFail: 'Connection failed. Is the server running?',
    ocrTitle: 'OCR — Scanning pages',
    ocrEstimate: 'Est. remaining:',
    qualityScore: 'Quality Score',
    chunks: 'Chunks',
    sections: 'Sections',
    qualityBreakdown: 'Quality Breakdown',
    structure: 'Structure',
    chunkConsistency: 'Chunk Consistency',
    metadata: 'Metadata',
    preset: 'Preset',
    cleaning: 'Cleaning',
    overlap: 'Overlap',
    download: 'Download',
    recommended: 'recommended',
    chunkPreview: 'Chunk Preview',
    docMetadata: 'Document Metadata',
    title: 'Title',
    language: 'Language',
    author: 'Author',
    bestOutput: 'Best output',
    ragLabel: 'RAG',
    ragDesc: 'Optimized for retrieval systems',
    kbLabel: 'Knowledge Base',
    kbDesc: 'Full hierarchy & documentation',
    ftLabel: 'Fine-Tuning',
    ftDesc: 'JSONL for LLM training',
    cleanLight: 'Light',
    cleanStandard: 'Standard',
    cleanAggressive: 'Aggressive',
    overlapSemantic: 'Semantic',
    overlapFixed: 'Fixed',
    pipelineSettings: 'Pipeline Settings',
    stageAnalyze: 'Analyzing file',
    stageExtract: 'Extracting content',
    stageOcrFix: 'OCR correction',
    stageNormalize: 'Normalizing text',
    stageClean: 'Cleaning noise',
    stageStructure: 'Building structure',
    stageChunk: 'Chunking content',
    stageExport: 'Exporting files',
    complete: 'Complete',
  },
  pt: {
    tagline: 'Motor de Extração de Conhecimento com IA',
    subtitle: 'Transforme documentos em conhecimento pronto para IA',
    dropHere: 'Arraste e solte seu documento aqui',
    dropHint: 'ou clique para selecionar',
    dropFormats: 'Suporta PDF, EPUB, MOBI, AZW, RTF, HTML, TXT — máx 500MB',
    dropReplace: 'Clique ou solte para substituir',
    presetHint: 'Selecione um modo de processamento — cada um ajusta limpeza, chunking e formato de saída',
    process: 'Processar Documento',
    processing: 'Processando...',
    pipeline: 'Executando pipeline de extração...',
    connFail: 'Falha na conexão. O servidor está rodando?',
    ocrTitle: 'OCR — Escaneando páginas',
    ocrEstimate: 'Tempo restante est.:',
    qualityScore: 'Qualidade',
    chunks: 'Chunks',
    sections: 'Seções',
    qualityBreakdown: 'Detalhamento da Qualidade',
    structure: 'Estrutura',
    chunkConsistency: 'Consistência dos Chunks',
    metadata: 'Metadados',
    preset: 'Preset',
    cleaning: 'Limpeza',
    overlap: 'Sobreposição',
    download: 'Baixar',
    recommended: 'recomendado',
    chunkPreview: 'Preview dos Chunks',
    docMetadata: 'Metadados do Documento',
    title: 'Título',
    language: 'Idioma',
    author: 'Autor',
    bestOutput: 'Melhor saída',
    ragLabel: 'RAG',
    ragDesc: 'Otimizado para sistemas de busca',
    kbLabel: 'Base de Conhecimento',
    kbDesc: 'Hierarquia completa e documentação',
    ftLabel: 'Fine-Tuning',
    ftDesc: 'JSONL para treino de LLM',
    cleanLight: 'Leve',
    cleanStandard: 'Padrão',
    cleanAggressive: 'Agressiva',
    overlapSemantic: 'Semântica',
    overlapFixed: 'Fixa',
    pipelineSettings: 'Configurações do Pipeline',
    stageAnalyze: 'Analisando arquivo',
    stageExtract: 'Extraindo conteúdo',
    stageOcrFix: 'Correção OCR',
    stageNormalize: 'Normalizando texto',
    stageClean: 'Limpando ruído',
    stageStructure: 'Construindo estrutura',
    stageChunk: 'Dividindo em chunks',
    stageExport: 'Exportando arquivos',
    complete: 'Concluído',
  },
};

const STAGE_KEYS: Record<string, string> = {
  analyze: 'stageAnalyze',
  extract: 'stageExtract',
  'ocr-fix': 'stageOcrFix',
  normalize: 'stageNormalize',
  clean: 'stageClean',
  structure: 'stageStructure',
  chunk: 'stageChunk',
  export: 'stageExport',
};

function getPresetInfo(lang: Lang) {
  const t = T[lang];
  return {
    rag: {
      label: t.ragLabel,
      desc: t.ragDesc,
      recommended: 'Markdown',
      cleaning: t.cleanStandard,
      overlap: t.overlapSemantic,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M3 4h14M3 8h10M3 12h14M3 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M18 16l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    'knowledge-base': {
      label: t.kbLabel,
      desc: t.kbDesc,
      recommended: 'Markdown',
      cleaning: t.cleanLight,
      overlap: t.overlapFixed,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 6h8M6 10h5M6 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    'fine-tuning': {
      label: t.ftLabel,
      desc: t.ftDesc,
      recommended: 'JSONL',
      cleaning: t.cleanAggressive,
      overlap: t.overlapFixed,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M4 4l4 4-4 4M10 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  } as Record<Preset, { label: string; desc: string; recommended: string; cleaning: string; overlap: string; icon: React.ReactNode }>;
}

// Components are now imported from /web/components/*

// ─── Main ────────────────────────────────────────────────
interface ProgressState {
  stage: string;
  step: number;
  total: number;
  message: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<Preset>('rag');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocr, setOcr] = useState<{ page: number; total: number; startedAt: number; pageTimestamps: number[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lang, setLang] = useState<Lang>('pt');
  const inputRef = useRef<HTMLInputElement>(null);

  const t = T[lang];
  const presetInfo = getPresetInfo(lang);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    setProgress(null);
    setOcr(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preset', preset);

      const res = await fetch('/api/process', { method: 'POST', body: formData });

      // Check if it's an error JSON response (validation errors return JSON, not SSE)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        setError(data.error || 'Processing failed');
        setProcessing(false);
        return;
      }

      // Parse SSE stream
      const reader = res.body?.getReader();
      if (!reader) { setError('No response stream'); setProcessing(false); return; }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (eventType === 'progress') {
              setProgress(data);
              // Track OCR page progress for time estimation
              if (data.message) {
                const ocrMatch = data.message.match(/OCR page (\d+)\/(\d+)/);
                if (ocrMatch) {
                  const page = parseInt(ocrMatch[1]);
                  const total = parseInt(ocrMatch[2]);
                  setOcr(prev => {
                    const now = Date.now();
                    const timestamps = prev?.pageTimestamps ?? [];
                    return { page, total, startedAt: prev?.startedAt ?? now, pageTimestamps: [...timestamps, now] };
                  });
                } else if (data.stage !== 'extract') {
                  setOcr(null);
                }
              }
            } else if (eventType === 'result') {
              setResult(data);
            } else if (eventType === 'error') {
              setError(data.error);
            }
          }
        }
      }
    } catch {
      setError(t.connFail);
    } finally {
      setProcessing(false);
      setProgress(null);
      setOcr(null);
    }
  };

  const barColor = (v: number) =>
    v >= 70 ? 'from-emerald-500 to-emerald-400' : v >= 40 ? 'from-amber-500 to-amber-400' : 'from-red-500 to-red-400';

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-2">
        <Logo />
        <div className="flex items-center gap-2.5">
          <FlagButton lang="pt" active={lang === 'pt'} onClick={() => setLang('pt')} />
          <FlagButton lang="en" active={lang === 'en'} onClick={() => setLang('en')} />
        </div>
      </header>

      <p className="text-zinc-500 text-sm mb-8">
        {t.tagline} <span className="text-zinc-700">—</span> <span className="text-zinc-600">{t.subtitle}</span>
      </p>

      {/* ── Upload Zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 mb-6 ${
          dragOver
            ? 'upload-zone-active'
            : file
              ? 'upload-zone upload-zone-done'
              : 'upload-zone'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.epub,.txt,.html,.htm,.rtf,.mobi,.azw,.azw3"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div>
            <FileIcon />
            <p className="text-base font-semibold text-emerald-400">{file.name}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {(file.size / 1024).toFixed(0)} KB <span className="text-zinc-700 mx-1">—</span> {t.dropReplace}
            </p>
          </div>
        ) : (
          <div>
            <UploadIcon />
            <p className="text-base text-zinc-400 font-medium">{t.dropHere}</p>
            <p className="text-xs text-zinc-600 mt-1">{t.dropHint}</p>
            <p className="text-[11px] text-zinc-700 mt-3">{t.dropFormats}</p>
          </div>
        )}
      </div>

      {/* ── Preset Selector ── */}
      <div className="mb-6">
        <p className="text-[11px] text-blue-400/70 mb-3 text-center tracking-wide">{t.presetHint}</p>
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(presetInfo) as [Preset, typeof presetInfo.rag][]).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setPreset(key)}
              className={`rounded-xl p-4 text-left transition-all duration-200 ${
                preset === key
                  ? 'glass-active'
                  : 'glass'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={preset === key ? 'text-blue-400' : 'text-zinc-500'}>{info.icon}</span>
                <span className="font-semibold text-sm">{info.label}</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{info.desc}</p>
              <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-600">{t.cleaning}</span>
                  <span className="text-zinc-400">{info.cleaning}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-600">{t.overlap}</span>
                  <span className="text-zinc-400">{info.overlap}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-600">{t.bestOutput}</span>
                  <span className="text-zinc-400">{info.recommended}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Process Button ── */}
      <button
        onClick={handleProcess}
        disabled={!file || processing}
        className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed mb-6 btn-process"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t.processing}
          </span>
        ) : t.process}
      </button>

      {/* ── Pipeline Progress ── */}
      {processing && (
        <div className="mb-6 p-5 rounded-xl glass">
          {/* Stage indicators */}
          <div className="flex items-start justify-between mb-4">
            {['analyze', 'extract', 'ocr-fix', 'normalize', 'clean', 'structure', 'chunk', 'export'].map((stage, i) => {
              const step = i + 1;
              const currentStep = progress?.step || 0;
              const isDone = currentStep > step;
              const isActive = currentStep === step;
              const stageKey = STAGE_KEYS[stage] || stage;

              return (
                <div key={stage} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="relative">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isActive
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 animate-pulse'
                          : 'bg-zinc-800/50 text-zinc-600 border border-zinc-800'
                    }`}>
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : step}
                    </div>
                  </div>
                  <span className={`text-[9px] leading-tight text-center transition-colors ${
                    isDone ? 'text-emerald-500/70' : isActive ? 'text-blue-400' : 'text-zinc-700'
                  }`}>
                    {t[stageKey] || stage}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
              style={{ width: `${progress ? (progress.step / progress.total) * 100 : 0}%` }}
            />
          </div>

          {/* Current stage message */}
          {progress?.message && (
            <p className="text-[11px] text-zinc-600 mt-2.5 text-center">{progress.message}</p>
          )}
        </div>
      )}

      {/* ── OCR Progress Box ── */}
      {ocr && ocr.total > 0 && processing && (() => {
        const percent = Math.round((ocr.page / ocr.total) * 100);
        const timestamps = ocr.pageTimestamps;
        let eta = '';
        if (timestamps.length >= 2) {
          const avgMs = (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1);
          const remaining = (ocr.total - ocr.page) * avgMs;
          const secs = Math.ceil(remaining / 1000);
          if (secs < 60) eta = `~${secs}s`;
          else if (secs < 3600) eta = `~${Math.ceil(secs / 60)}min`;
          else eta = `~${Math.floor(secs / 3600)}h ${Math.ceil((secs % 3600) / 60)}min`;
        }
        return (
          <div className="mb-6 p-4 rounded-xl glass border border-blue-500/20">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 7h8M4 9.5h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {t.ocrTitle}
              </span>
              <span className="text-sm font-bold text-blue-300 tabular-nums">{percent}%</span>
            </div>
            <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-zinc-600 tabular-nums">
                {lang === 'pt' ? 'Página' : 'Page'} {ocr.page} / {ocr.total}
              </span>
              {eta && (
                <span className="text-[10px] text-zinc-500 tabular-nums">
                  {t.ocrEstimate} {eta}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-5 rounded-xl glass text-center">
              <p className="text-3xl font-bold text-zinc-100">
                {result.quality.overall}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 tracking-wide">{t.qualityScore}</p>
            </div>
            <div className="p-5 rounded-xl glass text-center">
              <p className="text-3xl font-bold text-zinc-100">{result.chunksCount}</p>
              <p className="text-[11px] text-zinc-500 mt-1 tracking-wide">{t.chunks}</p>
            </div>
            <div className="p-5 rounded-xl glass text-center">
              <p className="text-3xl font-bold text-zinc-100">{result.sectionsCount}</p>
              <p className="text-[11px] text-zinc-500 mt-1 tracking-wide">{t.sections}</p>
            </div>
          </div>

          {/* Quality Breakdown */}
          <div className="p-5 rounded-xl glass">
            <p className="text-[11px] text-zinc-500 mb-4 uppercase tracking-wider font-medium">{t.qualityBreakdown}</p>
            <div className="space-y-3">
              {[
                { label: t.structure, value: result.quality.breakdown.structure, weight: '40%' },
                { label: t.chunkConsistency, value: result.quality.breakdown.chunkConsistency, weight: '30%' },
                { label: t.metadata, value: result.quality.breakdown.metadata, weight: '30%' },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500 w-40">{d.label} <span className="text-zinc-700">({d.weight})</span></span>
                  <div className="flex-1 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barColor(d.value)}`}
                      style={{ width: `${d.value}%`, transition: 'width 0.8s ease' }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 w-8 text-right font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Settings */}
          <div className="p-3.5 rounded-xl glass flex items-center justify-center gap-5 text-[11px]">
            <span className="text-zinc-600">{t.preset}: <span className="text-zinc-400 font-medium">{presetInfo[preset].label}</span></span>
            <span className="text-zinc-800">|</span>
            <span className="text-zinc-600">{t.cleaning}: <span className="text-zinc-400 font-medium">{presetInfo[preset].cleaning}</span></span>
            <span className="text-zinc-800">|</span>
            <span className="text-zinc-600">{t.overlap}: <span className="text-zinc-400 font-medium">{presetInfo[preset].overlap}</span></span>
          </div>

          {/* Download */}
          <div className="grid grid-cols-4 gap-2.5">
            {result.files.map((f) => {
              const isRec = f.format === presetInfo[preset].recommended.toLowerCase() ||
                (f.format === 'md' && presetInfo[preset].recommended === 'Markdown');
              return (
                <a
                  key={f.path}
                  href={`/api/download/${result.sessionId}/${f.path}`}
                  download
                  className={`py-3 rounded-xl text-center text-sm font-medium transition-all duration-200 ${
                    isRec
                      ? 'glass-active text-blue-300'
                      : 'glass text-zinc-400'
                  }`}
                >
                  {t.download} .{f.format}
                  {isRec && <span className="block text-[9px] text-blue-400/80 mt-0.5 font-normal">{t.recommended}</span>}
                </a>
              );
            })}
          </div>

          {/* Metadata */}
          <div className="p-5 rounded-xl glass">
            <p className="text-[11px] text-zinc-500 mb-3 uppercase tracking-wider font-medium">{t.docMetadata}</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-[11px] text-zinc-600 block mb-0.5">{t.title}</span>
                <span className="text-zinc-300 text-sm">{result.metadata.title || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-600 block mb-0.5">{t.language}</span>
                <span className="text-zinc-300 text-sm">{result.metadata.language || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-600 block mb-0.5">{t.author}</span>
                <span className="text-zinc-300 text-sm">{result.metadata.author || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-[11px] text-zinc-800">EXTRACTA v0.1.0</p>
      </footer>
    </main>
  );
}

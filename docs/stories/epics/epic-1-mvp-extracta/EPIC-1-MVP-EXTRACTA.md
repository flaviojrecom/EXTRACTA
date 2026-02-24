# Epic 1: EXTRACTA MVP — AI-Powered Knowledge Extraction Engine

## Epic Metadata

```yaml
epic_id: EPIC-1
title: "EXTRACTA MVP — CLI-first Document Extraction Pipeline"
status: Draft
priority: Critical
type: greenfield
estimated_stories: 6
created_by: "@pm (Morgan)"
created_at: 2026-02-23
source_documents:
  - docs/prd.md (EXTRACTA PRD)
  - docs/brainstorming/2026-02-23-extracta-brainstorming.md
```

---

## Epic Goal

Entregar uma CLI funcional que processa documentos PDF (texto) e EPUB, transformando-os em Markdown estruturado e JSON com chunking inteligente otimizado para RAG — validando o core value proposition do EXTRACTA com o mínimo de escopo necessário.

## Epic Description

### Context

EXTRACTA é um motor de extração de conhecimento que transforma documentos brutos em formatos prontos para IA (RAG, fine-tuning, knowledge bases). O MVP foca em provar o pipeline core com os formatos mais comuns (PDF texto + EPUB) e o output mais demandado (Markdown + JSON chunks).

### Strategic Decisions (from Brainstorming)

1. **CLI-first, UI-second** — Público-alvo primário são devs de IA. CLI é o canal de distribuição mais eficiente.
2. **HTML intermediário como lingua franca** — Todos os extractors convertem para HTML padronizado antes do processamento downstream.
3. **Adapter Pattern** — Interface `IExtractor` com implementações por formato. Extensível por design.
4. **MVP scope: PDF (texto) + EPUB + TXT** — 80% do valor com 20% do esforço. OCR e MOBI/AZW3 ficam para Fase 2.
5. **Monorepo-ready** — Separação `@extracta/core` + `@extracta/cli` desde o início para futura publicação como library.

### Technology Stack

- **Runtime:** Node.js 20+ / TypeScript 5+
- **CLI Framework:** Commander.js
- **PDF Extraction:** pdf-parse
- **EPUB Extraction:** jszip + cheerio (parse XHTML)
- **Tokenizer:** js-tiktoken (cl100k_base default)
- **Build:** tsup
- **Test:** Vitest
- **Linting:** ESLint + Prettier

### Out of Scope (MVP)

- MOBI / AZW3 / DOCX extraction
- OCR para PDFs escaneados
- Web UI / Frontend
- API Gateway
- Processamento assíncrono com filas (BullMQ)
- Watch folder mode
- LLM-assisted fallback
- Plugin system
- Indexação vetorial

---

## Stories

### Story 1.1: Project Setup & CLI Skeleton

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [architecture_review, pattern_validation]
complexity: M
```

**Description:** Setup do projeto TypeScript com estrutura monorepo-ready, CLI skeleton com Commander.js, e pipeline runner básico.

**Acceptance Criteria:**
- [ ] Projeto TypeScript inicializado com tsconfig, ESLint, Prettier, Vitest
- [ ] Estrutura de pastas: `src/core/`, `src/cli/`, `src/extractors/`, `src/pipeline/`, `src/exporters/`
- [ ] CLI responde a `extracta process <file> [options]` com help text
- [ ] Pipeline runner aceita um arquivo e executa etapas em sequência (stubs)
- [ ] Interface `IExtractor` definida: `extract(input: Buffer) → Promise<StandardHTML>`
- [ ] Interface `IExporter` definida: `export(content: ProcessedDocument, options: ExportOptions) → Promise<ExportResult>`
- [ ] `npm run build`, `npm test`, `npm run lint` funcionam
- [ ] README com instruções de setup

**Quality Gates:**
- Pre-Commit: Lint + typecheck
- Pre-PR: Architecture review — interfaces extensíveis, separation of concerns

---

### Story 1.2: PDF Text Extractor + EPUB Extractor

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [code_review, pattern_validation, test_coverage]
complexity: L
```

**Description:** Implementar os dois extractors do MVP usando o Adapter Pattern. Ambos convertem para HTML intermediário padronizado.

**Acceptance Criteria:**
- [ ] `PdfTextExtractor` implementa `IExtractor` usando pdf-parse
- [ ] Detecta se PDF é texto ou escaneado (retorna erro para escaneado no MVP)
- [ ] `EpubExtractor` implementa `IExtractor` usando jszip + cheerio
- [ ] Extrai conteúdo XHTML dos capítulos na ordem correta
- [ ] `TxtExtractor` implementa `IExtractor` (wrapper simples para texto puro)
- [ ] HTML intermediário padronizado com schema definido (headings, paragraphs, lists, tables, code blocks)
- [ ] File type detection automática por extensão e magic bytes
- [ ] Testes unitários com arquivos de amostra (min 3 PDFs, 2 EPUBs, 1 TXT)
- [ ] Cobertura de testes >= 80%

**Quality Gates:**
- Pre-Commit: Tests passing, lint clean
- Pre-PR: Test coverage check, error handling review

---

### Story 1.3: Normalizer + Semantic Cleaner

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [code_review, pattern_validation]
complexity: M
```

**Description:** Pipeline stages para normalização de texto e limpeza semântica de ruído estrutural.

**Acceptance Criteria:**
- [ ] **Normalizer:** Padronização de encoding (UTF-8), remoção de quebras artificiais, correção de hifenização, normalização Unicode, múltiplos espaços
- [ ] **Cleaner:** Remove headers/footers repetidos, numeração de página, ISBN, créditos legais
- [ ] Detecção de padrões repetitivos por frequência de ocorrência e posição no documento
- [ ] Configuração de agressividade: `light` (mínima), `standard` (recomendada), `aggressive` (máxima)
- [ ] Cada remoção é loggada para auditoria (o que foi removido e por quê)
- [ ] Testes com documentos reais que contêm ruído típico
- [ ] Pipeline integrado: Extract → Normalize → Clean funciona end-to-end

**Quality Gates:**
- Pre-Commit: Tests passing
- Pre-PR: Edge case review, false positive analysis

---

### Story 1.4: Hierarchical Structure Builder

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [code_review, algorithm_review]
complexity: L
```

**Description:** Reconstrução automática da hierarquia semântica do documento (capítulos, seções, subtítulos) a partir do HTML intermediário limpo.

**Acceptance Criteria:**
- [ ] Detecta headings por: tags HTML (h1-h6), numeração (1., 1.1, I., a.), caixa alta, padrões linguísticos
- [ ] Reconstrói hierarquia como árvore: Document → Chapter → Section → Subsection → Content
- [ ] Gera Markdown estruturado com heading levels corretos (`#`, `##`, `###`)
- [ ] Preserva: listas, tabelas, code blocks, blockquotes
- [ ] Gera metadados por seção: `{ chapter, section, level, word_count }`
- [ ] Extrai metadados do documento: `{ title, author, language }` (best-effort)
- [ ] Language detection automática (PT-BR, EN, ES mínimo)
- [ ] Testes com pelo menos 5 documentos com estruturas hierárquicas diferentes

**Quality Gates:**
- Pre-Commit: Tests passing
- Pre-PR: Algorithm correctness review, edge cases (flat documents, deeply nested)

---

### Story 1.5: Smart Chunking Engine

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [code_review, algorithm_review, performance_validation]
complexity: L
```

**Description:** Motor de chunking inteligente com overlap semântico, preservação de estruturas, e contagem precisa de tokens via tiktoken.

**Acceptance Criteria:**
- [ ] Chunking por seção semântica primeiro, depois por limite de tokens
- [ ] Token counting via js-tiktoken (cl100k_base default)
- [ ] Chunk size configurável: 500-1000 tokens (default: 750)
- [ ] Overlap semântico: última(s) frase(s) completa(s) do chunk anterior (não corte fixo)
- [ ] Sentence boundary detection funcional
- [ ] Nunca quebra no meio de: listas, tabelas, code blocks, parágrafos
- [ ] Metadados por chunk: `{ chunk_id, chapter, section, token_count, overlap_tokens }`
- [ ] Interface `ITokenizer` para permitir alternativas futuras
- [ ] Testes de consistência: todos os chunks dentro do range configurado
- [ ] Benchmark: processar documento de 100k tokens em < 5 segundos

**Quality Gates:**
- Pre-Commit: Tests + performance benchmarks
- Pre-PR: Algorithm review, edge cases (very short docs, single-paragraph docs)

---

### Story 1.6: Export System + CLI Integration + Quality Score

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [code_review, integration_testing, ux_review]
complexity: L
```

**Description:** Sistema de exportação com presets, quality score, e integração completa da CLI end-to-end.

**Acceptance Criteria:**
- [ ] **Exporters:** Markdown (.md), JSON estruturado (.json), JSONL para fine-tuning (.jsonl), TXT limpo (.txt)
- [ ] **Presets:** `knowledge-base` (hierarquia completa, sem chunking), `rag` (chunking otimizado, metadados completos), `fine-tuning` (JSONL com pares estruturados)
- [ ] **Quality Score (0-100):** Calcula score baseado em: % estrutura preservada, consistência de chunks, completude de metadados
- [ ] **CLI completa:**
  - `extracta process <file> --preset rag --output ./out`
  - `extracta process <file> --format md,json --chunk-size 750`
  - `extracta process <dir> --preset rag` (batch mode - processa todos os arquivos suportados)
  - `--no-cache` flag para forçar reprocessamento
  - `--verbose` para logging detalhado
  - `--dry-run` para análise sem exportação
- [ ] **Cache:** HTML intermediário cached por hash do arquivo (filesystem)
- [ ] **Progress output:** Mostra etapa atual e % de progresso no terminal
- [ ] Pipeline completo end-to-end funciona: file → analyze → extract → normalize → clean → structure → chunk → export
- [ ] Testes E2E com pelo menos 3 documentos reais (PDF, EPUB, TXT)
- [ ] README atualizado com exemplos de uso e documentação da CLI

**Quality Gates:**
- Pre-Commit: Full test suite passing
- Pre-PR: E2E integration review, CLI UX review, README completeness

---

## Dependency Graph

```
1.1 (Setup) ──→ 1.2 (Extractors) ──→ 1.3 (Normalize+Clean) ──→ 1.4 (Structure) ──→ 1.5 (Chunking) ──→ 1.6 (Export+CLI)
```

All stories are sequential — each builds on the previous.

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| pdf-parse não preserva estrutura suficiente | High | Medium | Avaliar pdf.js-extract como alternativa. Fallback para extração básica. |
| EPUB com estruturas não-padrão | Medium | Medium | Começar com EPUBs bem-formados. Log de warnings para estruturas inesperadas. |
| Heurísticas de hierarquia falham em docs flat | Medium | Low | Graceful degradation — doc sem hierarquia detectada vira single-section. |
| Performance com arquivos grandes | Medium | Low | Streaming no Fase 2. MVP funciona com arquivos < 50MB. |
| Token count difere entre modelos | Low | High | Documentar que default é cl100k_base. ITokenizer permite troca. |

## Rollback Plan

Projeto greenfield — rollback é simplesmente reverter commits/branches. Sem impacto em sistemas existentes.

## Definition of Done

- [ ] Todas as 6 stories completadas com acceptance criteria atendidos
- [ ] CLI funcional processando PDF, EPUB e TXT → Markdown/JSON/JSONL
- [ ] Quality score calculado e incluído no output
- [ ] Preset modes funcionando (knowledge-base, rag, fine-tuning)
- [ ] Testes automatizados passando com cobertura >= 80%
- [ ] Lint e typecheck limpos
- [ ] README com documentação completa da CLI
- [ ] Cache de resultados intermediários funcional

## Success Metrics

| Metric | Target |
|--------|--------|
| Formatos suportados | PDF (texto), EPUB, TXT |
| Formatos de saída | .md, .json, .jsonl, .txt |
| Tempo de processamento (doc 50 páginas) | < 30 segundos |
| Cobertura de testes | >= 80% |
| Quality score accuracy | Correlaciona com qualidade percebida |
| Chunk size consistency | 95% dos chunks dentro do range configurado |

---

## Handoff to Story Manager (@sm)

> "Please develop detailed user stories for Epic 1 — EXTRACTA MVP. Key considerations:
>
> - This is a **greenfield** Node.js/TypeScript project
> - Architecture: Pipeline pattern with Adapter Pattern for extractors
> - HTML intermediário é o formato interno entre extraction e processing
> - Stories são sequenciais (1.1 → 1.2 → ... → 1.6)
> - Cada story deve ser self-contained e testável isoladamente
> - Quality gates: @architect valida todas as stories (architecture + patterns)
> - Focus on: clean interfaces, extensibility, test coverage
>
> The epic delivers a functional CLI that processes PDF/EPUB/TXT into AI-ready Markdown/JSON with smart chunking."

---

*Epic created by Morgan (Strategist) — @pm*
*Source: PRD EXTRACTA + Brainstorming Session 2026-02-23*

# Brainstorming Session: EXTRACTA

**Date**: 2026-02-23
**Duration**: ~30 minutes
**Participants**: @architect (Aria), @pm (Morgan), @ux-design-expert, @data-engineer (Dara), @analyst (Atlas)
**Goal**: Solution
**Output Format**: Actionable

## Context

EXTRACTA is an AI-Powered Knowledge Extraction Engine that transforms raw documents (PDF, EPUB, MOBI, AZW3, DOCX, TXT) into structured outputs optimized for AI consumption: Markdown, TXT, JSON, JSONL, and chunked packages for embeddings.

---

## Desafios-Chave Identificados

| # | Desafio | Complexidade |
|---|---------|-------------|
| 1 | Pipeline de extração multi-formato (PDF/EPUB/MOBI/AZW3/DOCX) | Alta |
| 2 | OCR + pós-processamento para PDFs escaneados | Alta |
| 3 | Limpeza semântica (headers, footers, ISBN, ads) | Média-Alta |
| 4 | Reconstrução hierárquica automática (capítulos/seções) | Alta |
| 5 | Chunking inteligente sem quebrar estruturas | Média |
| 6 | Processamento assíncrono escalável (+200MB) | Média-Alta |

---

## Ideas Generated

**Total**: 26

### By Category

#### Arquitetura Core (5 ideas)

- **1.** Pipeline como DAG (Directed Acyclic Graph): Cada etapa (analyze → extract → normalize → clean → structure → chunk → export) como nó independente com retry e fallback. Usar um orquestrador como BullMQ ou Temporal.io para gerenciar o fluxo. (by @architect)
- **2.** Adapter Pattern para formatos: Interface `IExtractor` com implementações específicas (`PdfExtractor`, `EpubExtractor`, `MobiExtractor`). Facilita adicionar novos formatos sem alterar o pipeline core. (by @architect)
- **3.** HTML intermediário como lingua franca: Todos os extractors convertem para HTML padronizado antes da normalização. Isso unifica o processamento downstream independente do formato de entrada. (by @architect)
- **4.** Event-driven architecture: Cada etapa emite eventos (`extraction.complete`, `normalization.complete`) permitindo monitoring, logging e extensibilidade via plugins. (by @architect)
- **5.** Strategy Pattern para modos de exportação: Base de Conhecimento, RAG e Fine-tuning como strategies que configuram parâmetros de limpeza, chunking e formato de saída. (by @architect)

#### Estratégia de Produto (5 ideas)

- **6.** MVP laser-focused: Fase 1 deveria ser apenas PDF (texto) + TXT → Markdown. EPUB na Fase 1.5. Não tentar resolver todos os formatos de uma vez. (by @pm)
- **7.** CLI-first, UI-second: Começar como ferramenta CLI para devs (público-alvo primário). UI vem depois quando o pipeline estiver maduro. Reduz complexidade do MVP drasticamente. (by @pm)
- **8.** Feedback loop de qualidade: Incluir um "quality score" no output para que o usuário saiba a confiabilidade da extração (0-100). Isso diferencia o EXTRACTA de conversores genéricos. (by @pm)
- **9.** Preset profiles: Em vez de expor todos os parâmetros, criar presets como "RAG-optimized", "Knowledge-base", "Fine-tuning" que configuram tudo automaticamente. (by @pm)
- **10.** Plugin marketplace futuro: Arquitetar desde o início para permitir extractors/cleaners de terceiros. Mas NÃO implementar agora — apenas garantir que a arquitetura suporte. (by @pm)

#### UX & Interface (4 ideas)

- **11.** Progress streaming em tempo real: Para arquivos grandes, mostrar progresso por etapa do pipeline com estimativa de tempo. Cada fase reporta % de conclusão. (by @ux-design-expert)
- **12.** Preview antes de exportar: Permitir que o usuário visualize o resultado da extração (preview do Markdown renderizado) antes de baixar. Isso permite ajustes manuais. (by @ux-design-expert)
- **13.** Diff view para limpeza: Mostrar o que foi removido na limpeza semântica (antes/depois) para que o usuário entenda e confie no processo. Configurável por tipo de remoção. (by @ux-design-expert)
- **14.** Drag & drop + batch processing: Upload de múltiplos arquivos com fila visual. Cada arquivo mostra status individual. (by @ux-design-expert)

#### Performance & Dados (5 ideas)

- **15.** Streaming processing para arquivos grandes: Em vez de carregar o arquivo inteiro na memória, processar em stream (especialmente PDFs grandes). Usar chunks de I/O com backpressure. (by @data-engineer)
- **16.** Cache de resultados intermediários: Guardar HTML intermediário e metadados para permitir re-processamento com parâmetros diferentes sem re-extrair. Redis ou filesystem. (by @data-engineer)
- **17.** Tokenizer configurável: Usar tiktoken (OpenAI) como default para contagem de tokens no chunking, mas permitir outros tokenizers (sentencepiece, etc.) via configuração. (by @data-engineer)
- **18.** Overlap inteligente por contexto: Em vez de overlap fixo (100-200 tokens), usar overlap semântico — finalizar o chunk anterior com a última frase completa que dá contexto ao próximo. (by @data-engineer)
- **19.** Schema de metadados extensível: JSON Schema para metadados de documento e chunk. Permite validação e extensão sem breaking changes. (by @data-engineer)

#### Pesquisa & Inteligência (7 ideas)

- **20.** Benchmark contra ferramentas existentes: Comparar com Unstructured.io, LlamaIndex loaders, LangChain document loaders. Identificar gaps que o EXTRACTA preenche. (by @analyst)
- **21.** Heurísticas de limpeza baseadas em corpus: Treinar regras de limpeza usando um corpus de documentos reais (técnicos, acadêmicos, livros). Não inventar regras — derivar de dados. (by @analyst)
- **22.** Detecção de tipo de conteúdo por seção: Classificar seções como "definição", "exemplo", "exercício", "referência". Isso permite chunking semântico mais inteligente. (by @analyst)
- **23.** Multilingual desde o design: Garantir que heurísticas de limpeza e reconstrução hierárquica funcionem para PT-BR, EN, ES no mínimo. Padrões linguísticos variam muito entre idiomas. (by @analyst)
- **24.** "Watch folder" mode: Monitora uma pasta e processa automaticamente novos arquivos. Ideal para pipelines de ingestão contínua. (by @analyst — wild card)
- **25.** LLM-assisted extraction como fallback: Quando heurísticas falham na reconstrução hierárquica, usar um LLM (local ou API) como fallback para classificar seções. Custoso, mas alta precisão. (by @analyst — wild card)
- **26.** EXTRACTA como library, não só app: Publicar o core como pacote npm para que outros projetos integrem a extração diretamente. (by @analyst — wild card)

---

## Top 10 Recommendations

### 1. CLI-first com Pipeline DAG (Ideas 7 + 1)

**Value Score**: 10/10
**Effort Estimate**: 6/10
**ROI**: 1.67

**Why this matters**: Reduz escopo do MVP dramaticamente. Pipeline como CLI com BullMQ permite testar toda a lógica sem UI.

**Next Steps**:
- [ ] Definir CLI interface (`extracta process <file> --mode rag --output ./out`)
- [ ] Setup projeto Node.js/TypeScript com BullMQ
- [ ] Implementar pipeline runner com etapas como jobs encadeados
- [ ] Criar testes E2E com arquivos de amostra

### 2. Adapter Pattern + HTML intermediário (Ideas 2 + 3)

**Value Score**: 9/10
**Effort Estimate**: 5/10
**ROI**: 1.80

**Why this matters**: Desacopla extração do processamento. Cada formato é isolado. Novos formatos = novo adapter.

**Next Steps**:
- [ ] Definir interface `IExtractor` (input: File → output: StandardHTML)
- [ ] Implementar `PdfTextExtractor` usando pdf-parse ou pdf.js
- [ ] Implementar `EpubExtractor` usando epub.js ou jszip + cheerio
- [ ] Definir schema do HTML intermediário padronizado

### 3. MVP: PDF (texto) + EPUB → Markdown (Idea 6)

**Value Score**: 9/10
**Effort Estimate**: 4/10
**ROI**: 2.25

**Why this matters**: 80% do valor com 20% do esforço. PDF e EPUB cobrem a maioria dos use cases.

**Next Steps**:
- [ ] Excluir MOBI/AZW3/DOCX do Fase 1 (mover para Fase 2)
- [ ] Focar em PDF texto + EPUB como formatos iniciais
- [ ] TXT como formato trivial incluído
- [ ] Definir acceptance criteria do MVP

### 4. Streaming para arquivos grandes (Idea 15)

**Value Score**: 8/10
**Effort Estimate**: 7/10
**ROI**: 1.14

**Why this matters**: Requisito não-funcional crítico (+200MB). Sem streaming, o sistema não escala.

**Next Steps**:
- [ ] Implementar file upload com multipart streaming
- [ ] Processar PDFs com pdf-parse em modo stream
- [ ] Definir limites de memória por job
- [ ] Testar com arquivos de 200MB+

### 5. Chunking com overlap semântico (Idea 18)

**Value Score**: 9/10
**Effort Estimate**: 5/10
**ROI**: 1.80

**Why this matters**: Diferencial competitivo real. Overlap fixo é o padrão do mercado. Overlap semântico preserva contexto.

**Next Steps**:
- [ ] Implementar sentence boundary detection (natural, compromise, ou regex)
- [ ] Chunk por seção semântica primeiro, depois por token limit
- [ ] Overlap = última(s) frase(s) completa(s) do chunk anterior
- [ ] Benchmark contra overlap fixo com retrieval tests

### 6. Quality Score no output (Idea 8)

**Value Score**: 8/10
**Effort Estimate**: 4/10
**ROI**: 2.00

**Why this matters**: Diferencial de produto. Nenhum concorrente oferece confiabilidade mensurável.

**Next Steps**:
- [ ] Definir métricas: % estrutura preservada, % ruído removido, consistência de chunks
- [ ] Calcular score por etapa do pipeline
- [ ] Score final = média ponderada
- [ ] Incluir no JSON de metadados do output

### 7. Cache de resultados intermediários (Idea 16)

**Value Score**: 7/10
**Effort Estimate**: 4/10
**ROI**: 1.75

**Why this matters**: Permite re-exportar com parâmetros diferentes sem re-processar. Economiza tempo e custo.

**Next Steps**:
- [ ] Cache do HTML intermediário em filesystem (hash do arquivo como key)
- [ ] Cache de metadados extraídos
- [ ] Flag `--no-cache` para forçar reprocessamento
- [ ] TTL configurável para limpeza automática

### 8. Preset profiles para modos de exportação (Ideas 9 + 5)

**Value Score**: 7/10
**Effort Estimate**: 3/10
**ROI**: 2.33

**Why this matters**: Simplifica UX drasticamente. Usuário escolhe "rag" e tudo se configura.

**Next Steps**:
- [ ] Definir 3 presets: `knowledge-base`, `rag`, `fine-tuning`
- [ ] Cada preset configura: nível de limpeza, chunk size, overlap, formato
- [ ] CLI: `extracta process file.pdf --preset rag`
- [ ] Permitir override individual de parâmetros

### 9. Tokenizer configurável com tiktoken default (Idea 17)

**Value Score**: 7/10
**Effort Estimate**: 3/10
**ROI**: 2.33

**Why this matters**: Contagem precisa de tokens é fundamental para RAG e fine-tuning. tiktoken é o padrão da indústria.

**Next Steps**:
- [ ] Instalar tiktoken (js-tiktoken ou @anthropic-ai/tokenizer)
- [ ] Default: cl100k_base (GPT-4/Claude compatible)
- [ ] Interface `ITokenizer` para permitir alternativas
- [ ] Expor contagem real nos metadados de cada chunk

### 10. Publicar como library npm (Idea 26)

**Value Score**: 8/10
**Effort Estimate**: 5/10
**ROI**: 1.60

**Why this matters**: Multiplica alcance. Devs de IA podem integrar diretamente em seus pipelines.

**Next Steps**:
- [ ] Separar core logic do CLI (monorepo: `@extracta/core` + `@extracta/cli`)
- [ ] API pública: `extracta.process(file, options) → Promise<Result>`
- [ ] Documentar API com exemplos
- [ ] Setup publicação npm com CI/CD

---

## Key Insights

1. **CLI-first é o caminho certo** — O público-alvo são devs de IA. Uma CLI bem feita gera mais adoção que uma UI bonita nessa fase.

2. **HTML intermediário é a decisão arquitetural mais importante** — Unifica todo o processamento downstream e desacopla extração de transformação.

3. **O diferencial competitivo real são 3 coisas:** overlap semântico no chunking, quality score mensurável, e presets otimizados por use case.

4. **Não tentar resolver OCR no MVP** — PDF escaneado é um problema complexo (Tesseract, pós-processamento). Focar em PDF texto + EPUB primeiro.

5. **Pensar como library desde o dia 1** — Mesmo que o CLI venha primeiro, a separação core/cli evita rewrite futuro.

---

## Session Metadata

- **Ideas Generated**: 26
- **Categories Identified**: 5
- **Agents Participated**: 5
- **Session Duration**: ~30 minutes
- **Session Goal**: Solution
- **Output Format**: Actionable

# EXTRACTA — AI-Powered Knowledge Extraction Engine

Transforme documentos em conhecimento pronto para IA.

## Formatos Suportados

PDF, EPUB, MOBI, AZW/AZW3, RTF, HTML, TXT

## Quick Start

```bash
# 1. Descompacte e entre na pasta
unzip EXTRACTA.zip && cd EXTRACTA

# 2. Rode o setup (instala deps + builda)
chmod +x setup.sh && ./setup.sh

# 3. Inicie a Web UI
npm run web
# Acesse: http://localhost:3000
```

## CLI

```bash
# Processar documento (presets: knowledge-base, rag, fine-tuning)
npm run extracta -- process documento.pdf
npm run extracta -- process livro.epub --preset rag
npm run extracta -- process pagina.html --preset fine-tuning

# Ver todas as opções
npm run extracta -- process --help
```

## Web UI

```bash
npm run web
# Abre http://localhost:3000
# Arraste e solte qualquer documento suportado
```

## Requisitos

- Node.js 18+
- macOS / Linux / Windows (WSL)

## Features

- 8-stage pipeline: Analyze → Extract → OCR Fix → Normalize → Clean → Structure → Chunk → Export
- OCR automático para PDFs escaneados (Tesseract.js)
- Pós-processamento OCR com correção de português
- 3 presets: Knowledge Base (MD), RAG (JSON), Fine-Tuning (JSONL)
- Interface web com progresso em tempo real (SSE)
- Suporte a 7 formatos de documento

# Design Squad Commands

Comandos para ativar e usar os agentes especializados do Design Squad.

## Agentes Disponíveis

### 🎯 Orquestrador
### @design-chief
**Design System Orchestrator & Request Router**

Orquestra todos os agentes do design squad e roteia requests para especialistas.

```bash
@design-chief
```

**Quando usar:**
- Triagem e classificação de requests
- Roteamento automático para agente certo
- Análise de dependências
- Orquestração de trabalho complexo

**Quick Commands:**
```
*triage                # Classifica IN_SCOPE/OUT_OF_SCOPE
*route                 # Roteia para agente especializado
*dependency-analysis   # Analisa dependências
*review-plan          # Revisa plano antes de entrega
```

---

### 🎨 Specialists

### 1. @brad-frost
**Design System Architect & Pattern Consolidator**

Especialista em Atomic Design, consolidação de padrões e arquitetura de design systems.

```bash
@brad-frost
```

**Quick Commands:**
```
*audit-codebase          # Audita padrões existentes
*atomic-refactor         # Planeja refatoração
*consolidate-patterns    # Consolida duplicatas
*ds-setup               # Configura novo design system
*build-component        # Cria novo componente
```

---

### 2. @dave-malouf
**DesignOps Pioneer & Scaling Expert**

Especialista em DesignOps, escalamento de times e estrutura organizacional.

```bash
@dave-malouf
```

**Quick Commands:**
```
*maturity-assessment    # Avalia maturidade DesignOps
*scale-design          # Cria estratégia de escala
*governance-setup      # Configura governança
*team-scaling          # Plano para crescimento
*designops-metrics     # Define métricas
```

---

### 3. @dan-mall
**Design System Seller & Collaboration Expert**

Especialista em vendas de design systems, Element Collages e Hot Potato Process.

```bash
@dan-mall
```

**Quick Commands:**
```
*element-collage       # Cria exploração visual
*hot-potato            # Configura colaboração
*stakeholder-pitch     # Prepara apresentação
*ds-timeline           # Cria roadmap 90 dias
*show-pain             # Documenta dor visual
```

---

### 4. @nano-banana-generator
**Visual Utility Specialist & AI Image Generation**

Especialista em geração de imagens usando Google Gemini via OpenRouter.

```bash
@nano-banana-generator
```

**Quick Commands:**
```
*generate              # Gera imagem
*concept               # Desenvolve conceito
*refine                # Refina prompt
*batch                 # Gera variações
*upscale               # Amplia resolução (2K/4K)
*style-guide           # Cria referência de estilo
```

---

### 5. @storybook-expert
**Component Story Architect & Documentation Specialist**

Especialista em Storybook, CSF3, interaction testing, visual regression.

```bash
@storybook-expert
```

**Quick Commands:**
```
*install               # Instala Storybook
*write-story           # Escreve story CSF3
*audit-stories         # Audita qualidade
*setup-tests           # Configura interaction testing
*brownfield-scan       # Escaneia componentes legados
*migrate-brownfield    # Migra stories
```

---

### 6. @ds-token-architect
**Design System Token Architect (Atlas)**

Especialista em transformação tokens Figma → JSON/CSS/TS.

```bash
@ds-token-architect
```

**Quick Commands:**
```
*ingest-figma          # Ingere tokens do Figma
*normalize             # Normaliza e estrutura
*validate              # Valida integridade
*generate-artifacts    # Gera tokens.json, CSS, TS
*audit-tokens          # Audita qualidade
*modes-themes          # Configura dark mode, themes
```

---

### 7. @ds-foundations-lead
**Design System Foundations Pipeline Lead**

Especialista em pipeline shadcn/UI + tokens customizados.

```bash
@ds-foundations-lead
```

**Quick Commands:**
```
*phase-1               # Foundations & Tokens
*phase-2               # Base Components
*phase-3               # Derived Components
*pipeline-status       # Status do pipeline
*ingest-figma-tokens   # Ingere tokens
*adapt-components      # Adapta shadcn
```

---

## Workflow Integration

Veja [INTEGRATION.md](./INTEGRATION.md) para detalhes completos sobre como os agentes trabalham juntos.

### Architectural Workflow Paths

#### New Design System (Greenfield)
```
@design-chief
    ↓ *triage
@dave-malouf (Planning)
    ↓ *maturity-assessment
@ds-token-architect (Token Architecture)
    ↓ *ingest-figma
@ds-foundations-lead (Foundations Pipeline)
    ↓ *phase-1, *phase-2, *phase-3
@brad-frost (Design System Architecture)
    ↓ *ds-setup
@storybook-expert (Documentation)
    ↓ *install
@dan-mall (Selling)
    ↓ *stakeholder-pitch
```

#### Brownfield Migration (Legacy Components)
```
@design-chief
    ↓ *triage
@storybook-expert
    ↓ *brownfield-scan
@brad-frost
    ↓ *audit-codebase
@storybook-expert
    ↓ *migrate-brownfield
@ds-token-architect (Optional token extraction)
    ↓ *ingest-figma
```

#### Exploration → Implementation → Scale
```
@design-chief → @dan-mall (Exploration)
              → @nano-banana-generator (Visualization)
              → @brad-frost (Implementation)
              → @storybook-expert (Documentation)
              → @dave-malouf (Scaling)
```

#### Token Transformation → Component Adaptation
```
@design-chief
    ↓ *triage
@ds-token-architect (Token Architecture)
    ↓ *ingest-figma → *normalize → *generate-artifacts
@ds-foundations-lead (Foundations Pipeline)
    ↓ *phase-1 (tokens) → *phase-2 (base) → *phase-3 (derived)
@storybook-expert (Documentation)
    ↓ *write-story
```

---

## Common Workflows

### 🆕 Iniciar Novo Design System
1. `@design-chief` com `*triage` (classifica work)
2. `@dave-malouf` com `*maturity-assessment` (planeja estrutura)
3. `@ds-token-architect` com `*ingest-figma` (estrutura tokens)
4. `@ds-foundations-lead` com `*phase-1`, `*phase-2`, `*phase-3` (adapta componentes)
5. `@brad-frost` com `*ds-setup` (define governança padrões)
6. `@storybook-expert` com `*install` (documenta)
7. `@dan-mall` com `*stakeholder-pitch` (vende)

### 🔍 Brownfield Migration (Componentes Legados)
1. `@design-chief` com `*triage`
2. `@storybook-expert` com `*brownfield-scan` (escaneia)
3. `@brad-frost` com `*audit-codebase` (audita padrões)
4. `@storybook-expert` com `*migrate-brownfield` (migra)

### 🎨 Explorar & Implementar
1. `@design-chief` com `*triage`
2. `@dan-mall` com `*element-collage` (exploração visual)
3. `@nano-banana-generator` com `*batch` (variações)
4. `@brad-frost` com `*build-component` (implementa)
5. `@storybook-expert` com `*write-story` (documenta)

### 🔧 Token Transformation (Figma → Componentes)
1. `@ds-token-architect` com `*ingest-figma` (ingere)
2. `@ds-token-architect` com `*normalize` (normaliza)
3. `@ds-token-architect` com `*generate-artifacts` (gera artifacts)
4. `@ds-foundations-lead` com `*phase-1` (aplica tokens)
5. `@ds-foundations-lead` com `*phase-2`, `*phase-3` (adapta componentes)

---

## File Structure

```
.claude/commands/squads/design/
├── agents/
│   ├── brad-frost.md              # Commands para Brad Frost
│   ├── dave-malouf.md             # Commands para Dave Malouf
│   ├── dan-mall.md                # Commands para Dan Mall
│   └── nano-banana-generator.md   # Commands para Nano Banana
├── INTEGRATION.md                  # Integration patterns
└── README.md                        # Este arquivo
```

---

## Using Commands

### Ativar um Agente

```bash
@brad-frost
```

Depois digite um comando com prefixo `*`:

```bash
*audit-codebase
```

### Ver Todos os Comandos

```bash
@brad-frost
*help
```

Cada agente suporta `*help` para listar todos os comandos disponíveis.

---

## Integration with AIOS

Estes comandos seguem o padrão AIOS:

- **Activation:** `@agent-name` para ativar
- **Commands:** `*command-name` para executar
- **Persona:** Cada agente mantém sua persona completa
- **Handoffs:** Suportam transição clara entre agentes
- **Context:** Preservam contexto do projeto

Veja `squads/design/agents/` para definições completas de cada agente.

---

## Support

Para mais detalhes sobre cada agente:

- **Brad Frost:** `squads/design/agents/brad-frost.md`
- **Dave Malouf:** `squads/design/agents/dave-malouf.md`
- **Dan Mall:** `squads/design/agents/dan-mall.md`
- **Nano Banana Generator:** `squads/design/agents/nano-banana-generator.md`

---

*Design Squad Commands v1.0 - AIOS Integrated*

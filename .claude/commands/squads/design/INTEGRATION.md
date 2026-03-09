# Design Squad Agents - Integration Guide

Este documento descreve como os 4 agentes do design squad trabalham juntos e quando usar cada um.

## Agent Overview

| Agent | Especialidade | Tier | Quando Usar |
|-------|---------------|------|-----------|
| **@brad-frost** | Atomic Design & Pattern Consolidation | 2 | Auditar, consolidar padrões, refatoração |
| **@dave-malouf** | DesignOps Pioneer & Scaling | 0 | Escalar times, processos, governança |
| **@dan-mall** | Design System Seller & Collaboration | 1 | Exploração visual, vendas, colaboração |
| **@nano-banana-generator** | AI Image Generation Specialist | 1 | Gerar imagens, conceitos, variações |

## Workflow Integration Patterns

### Pattern 1: Design System Build-Out

```
@dave-malouf (Planning)
    ↓ Define estrutura e timeline
@brad-frost (Consolidation)
    ↓ Audita código, consolida padrões
@nano-banana-generator (Visualization)
    ↓ Gera referências visuais
@dan-mall (Selling)
    ↓ Prepara pitch para stakeholders
```

**Scenario:** Construindo novo design system do zero
- Dave define estrutura organizacional e timeline
- Brad audita padrões existentes e consolida
- Nano gera referências visuais dos componentes
- Dan prepara apresentação para buy-in

### Pattern 2: Exploration → Implementation → Scaling

```
@dan-mall (Exploration)
    ↓ Element Collages, direção visual
@brad-frost (Implementation)
    ↓ Implementa componentes, atomic design
@dave-malouf (Scaling)
    ↓ Estrutura processos para escala
@nano-banana-generator (Documentation)
    ↓ Cria assets e referências visuais
```

**Scenario:** Novo produto/feature com design system
- Dan cria Element Collages para exploração
- Brad implementa componentes baseado em decisões
- Dave estrutura processos para crescimento
- Nano gera documentação visual

### Pattern 3: Optimization & Governance

```
@brad-frost (Analysis)
    ↓ Audita componentes, identifica dúplicatas
@dave-malouf (Governance)
    ↓ Define processos, métricas, estrutura
@dan-mall (Communication)
    ↓ Comunica mudanças, train times
@nano-banana-generator (Visualization)
    ↓ Cria guias visuais, training materials
```

**Scenario:** Otimizar design system existente
- Brad analisa componentes e identifica problemas
- Dave define governança e processos de otimização
- Dan comunica benefícios aos stakeholders
- Nano cria materiais visuais de training

### Pattern 4: Team Scaling + Collaboration

```
@dave-malouf (Structure)
    ↓ Planeja crescimento, contrata designers
@dan-mall (Collaboration)
    ↓ Implementa Hot Potato com developers
@brad-frost (Standards)
    ↓ Define padrões e componentes
@nano-banana-generator (Training)
    ↓ Cria referências visuais para onboarding
```

**Scenario:** Escalar equipe de design
- Dave cria estrutura para novo time
- Dan implementa Hot Potato entre design e dev
- Brad estabelece padrões e componentes
- Nano cria materiais de onboarding

## Handoff Protocol

### Brad-Frost → Dan-Mall

**Quando:** Componentes consolidados, pronto para vender
**Context passado:**
- Componentes finalizados
- Design tokens documentados
- Padrões consolidados
- Métricas de qualidade

```markdown
## HANDOFF: @brad-frost → @dan-mall

**Phase Completed:** Pattern consolidation & atomic refactor

**Deliverables:**
- Component library consolidated
- Design tokens: [path]
- Atomic design structure: atoms, molecules, organisms
- Quality metrics: [metrics]

**For Next Phase:**
Create Element Collages and stakeholder pitch using these components
```

### Dan-Mall → Brad-Frost

**Quando:** Direção visual aprovada, pronto para implementação
**Context passado:**
- Element Collages aprovadas
- Direção visual consensuada
- Decisões de feel/look
- Stakeholder feedback

```markdown
## HANDOFF: @dan-mall → @brad-frost

**Phase Completed:** Visual exploration & direction

**Deliverables:**
- Element Collages: [path]
- Direction consensus: [summary]
- Stakeholder feedback: [feedback]
- Component priorities: [list]

**For Next Phase:**
Implement components based on approved direction
```

### Dave-Malouf → Brad-Frost

**Quando:** Estrutura definida, pronto para implementar padrões
**Context passado:**
- Governança definida
- Timeline aprovada
- Prioridades de padrões
- Métricas de sucesso

```markdown
## HANDOFF: @dave-malouf → @brad-frost

**Phase Completed:** DesignOps structure & governance

**Deliverables:**
- Governance framework: [path]
- Timeline: [timeline]
- Pattern priorities: [priorities]
- Success metrics: [metrics]

**For Next Phase:**
Consolidate and implement patterns according to timeline
```

### Brad-Frost → Dave-Malouf

**Quando:** Padrões consolidados, pronto para escalar
**Context passado:**
- Componentes consolidados
- Padrões documentados
- Métricas de qualidade
- Repositório organizado

```markdown
## HANDOFF: @brad-frost → @dave-malouf

**Phase Completed:** Pattern consolidation

**Deliverables:**
- Component library: [path]
- Pattern documentation: [path]
- Quality metrics: [metrics]
- Repository structure: [structure]

**For Next Phase:**
Scale team and implement governance processes
```

### Nano-Banana-Generator → Others

**Quando:** Assets gerados, prontos para uso
**Context passado:**
- Imagens geradas: [paths]
- Prompts usados: [prompts]
- Metadados: aspect ratio, resolução, modelo
- Variações exploradas

```markdown
## HANDOFF: @nano-banana-generator → @{to_agent}

**Phase Completed:** Image generation

**Deliverables:**
- Generated images: [paths]
- Prompts used: [prompts]
- Metadata: [specs]
- Variations explored: [variations]

**For Next Phase:**
[Context for next phase]
```

## Quick Start

### Começar um novo projeto Design System

1. **Comece com @dave-malouf**
   ```
   @dave-malouf
   *maturity-assessment
   ```
   Avalie maturidade atual e defina estrutura.

2. **Depois @brad-frost**
   ```
   @brad-frost
   *audit-codebase
   ```
   Audit padrões existentes.

3. **Depois @dan-mall**
   ```
   @dan-mall
   *element-collage
   ```
   Explore direção visual.

4. **Use @nano-banana-generator** conforme necessário
   ```
   @nano-banana-generator
   *generate
   ```
   Gere referências visuais.

### Começar exploração de direção

1. **Comece com @dan-mall**
   ```
   @dan-mall
   *element-collage
   ```
   Explore direção visual.

2. **Depois @nano-banana-generator** (opcional)
   ```
   @nano-banana-generator
   *batch
   ```
   Gere variações se necessário.

3. **Depois @brad-frost** (após aprovação)
   ```
   @brad-frost
   *build-component
   ```
   Implemente componentes.

4. **Use @dave-malouf** para escalar
   ```
   @dave-malouf
   *scale-design
   ```
   Estruture operações.

### Começar otimização de DS existente

1. **Comece com @brad-frost**
   ```
   @brad-frost
   *audit-codebase
   ```
   Audite padrões atuais.

2. **Depois @dave-malouf**
   ```
   @dave-malouf
   *governance-setup
   ```
   Define novo processos.

3. **Use @dan-mall** para comunicar
   ```
   @dan-mall
   *stakeholder-pitch
   ```
   Venda aos stakeholders.

4. **Use @nano-banana-generator** para documentação
   ```
   @nano-banana-generator
   *style-guide
   ```
   Cria guias visuais.

## Common Commands by Agent

### Brad-Frost Commands
```
*audit-codebase          # Audita padrões
*atomic-refactor         # Planeja refatoração
*consolidate-patterns    # Consolida duplicatas
*ds-setup               # Configura novo DS
*build-component        # Cria novo componente
*governance             # Define governança
```

### Dave-Malouf Commands
```
*maturity-assessment    # Avalia maturidade DesignOps
*scale-design          # Estratégia de escala
*governance-setup      # Configura governança
*team-scaling          # Plano de crescimento
*designops-metrics     # Define métricas e KPIs
*team-health           # Diagnóstico do time
```

### Dan-Mall Commands
```
*element-collage       # Cria exploração visual
*hot-potato            # Configura colaboração
*stakeholder-pitch     # Prepara apresentação
*ds-timeline           # Cria roadmap 90 dias
*show-pain             # Documenta dor visual
*collaboration-setup   # Estrutura colaboração
```

### Nano-Banana-Generator Commands
```
*generate              # Gera imagem
*concept               # Desenvolve conceito
*refine                # Refina prompt
*batch                 # Gera variações
*upscale               # Amplia resolução
*style-guide           # Cria referência
```

---

*Última atualização: 2026-02-26*

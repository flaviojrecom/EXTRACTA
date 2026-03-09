# @ds-foundations-lead

## Command Palette

Ativa o agente **ds-foundations-lead** - Design System Foundations Pipeline Lead.

### Activation

```bash
@ds-foundations-lead
```

### Quick Commands

| Comando | Descrição |
|---------|-----------|
| `*help` | Mostra todos os comandos disponíveis |
| `*phase-1` | Foundations & Tokens (ingest, map, apply, QA) |
| `*phase-2` | Base Components (adapt shadcn, QA) |
| `*phase-3` | Derived Components (derive, QA) |
| `*pipeline-status` | Status do pipeline completo |
| `*ingest-figma-tokens` | Ingere tokens do Figma |
| `*map-to-shadcn` | Mapeia para shadcn CSS vars |
| `*adapt-components` | Adapta componentes shadcn |
| `*exit` | Sai do modo Foundations Lead |

### Common Workflows

1. **Phase 1 - Foundations & Tokens**
   ```
   *phase-1
   ```
   - Ingere tokens Figma
   - Mapeia para shadcn CSS vars
   - Aplica em globals.css
   - QA gates

2. **Phase 2 - Base Components**
   ```
   *phase-2
   ```
   - Adapta componentes shadcn base
   - Aplica tokens visuais
   - QA gates

3. **Phase 3 - Derived Components**
   ```
   *phase-3
   ```
   - Deriva componentes custom
   - Mantém acessibilidade shadcn
   - QA final

### When to Use ds-foundations-lead

Use `@ds-foundations-lead` para:
- ✅ Adaptar shadcn/UI com tokens customizados
- ✅ Orquestrar pipeline Figma → componentes
- ✅ Mapear tokens para CSS variables
- ✅ Adaptar componentes shadcn
- ✅ QA gates entre fases
- ✅ Garantir parity dark mode

### Pipeline Phases

**Phase 1: Foundations & Tokens**
- Ingest Figma tokens
- Map to shadcn CSS vars
- Apply to globals.css
- QA gate before Phase 2

**Phase 2: Base Components**
- Ingest base components
- Adapt shadcn components
- Apply visual tokens
- QA gate before Phase 3

**Phase 3: Derived Components**
- Derive custom components
- Maintain a11y + API
- Final QA gate

### Core Principles

**Figma is Source of Truth:**

- **Figma Source:** Decisões visuais vêm do Figma
- **Preserve shadcn:** Logic, props, accessibility MUST stay
- **OKLch Colors:** shadcn/Tailwind v4 standard
- **Mapping:** Toda CSS var tem mapeamento
- **Dark Parity:** Dark mode obrigatório
- **No Invention:** Só o que vem do Figma
- **Sequential QA:** Gates entre cada fase

### Token Mapping

- Base tokens → CSS vars (`:root`)
- Semantic tokens → CSS vars
- Component tokens → CSS vars
- Modes/themes → `data-theme` ou prefers-color-scheme

### Integration with Other Agents

- **@ds-token-architect** → Atlas normaliza tokens, Foundations consome
- **@brad-frost** → Brad define padrões, Foundations implementa
- **@storybook-expert** → Storybook documenta componentes criados
- **@design-chief** → Chief orquestra, Foundations executa pipeline

---

*Para mais detalhes sobre ds-foundations-lead, consulte `squads/design/agents/ds-foundations-lead.md`*

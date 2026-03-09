# @design-chief

## Command Palette

Ativa o agente **design-chief** - Design System Orchestrator & Request Router.

### Activation

```bash
@design-chief
```

### Quick Commands

| Comando | Descrição |
|---------|-----------|
| `*help` | Mostra todos os comandos disponíveis |
| `*triage` | Classifica request como IN_SCOPE ou OUT_OF_SCOPE |
| `*route` | Roteia para agente especializado correto |
| `*review-plan` | Revisa plano antes de entrega |
| `*handoff` | Transfere para squad ou agente específico |
| `*scope-check` | Verifica se trabalho está em scope |
| `*dependency-analysis` | Analisa dependências antes de paralelizar |
| `*exit` | Sai do modo Design Chief |

### Common Workflows

1. **Triage Request**
   ```
   *triage
   ```
   Classifica se é IN_SCOPE (design system) ou OUT_OF_SCOPE (brand/content).

2. **Route to Specialist**
   ```
   *route
   ```
   Roteia automaticamente para agente correto baseado em keywords.

3. **Dependency Analysis**
   ```
   *dependency-analysis
   ```
   Analisa dependências antes de parallelizar execução.

4. **Handoff & Escalation**
   ```
   *handoff
   ```
   Transfere para squad ou agente específico com contexto.

### Routing Matrix

#### IN SCOPE Routes

| Request | Route To | Keywords |
|---------|----------|----------|
| Design System & Components | `@brad-frost` | design system, atomic, pattern, registry, metadata |
| Foundations Pipeline (F1-F3) | `@ds-foundations-lead` | foundations, figma tokens, base components |
| Token Architecture | `@ds-token-architect` | token architect, figma variables, normalization |
| Storybook & Stories | `@storybook-expert` | storybook, csf3, stories, brownfield, migration |
| DesignOps & Scaling | `@dave-malouf` | designops, maturity, process, scaling, governance |
| Adoption & Sales | `@dan-mall` | buy-in, stakeholder, pitch, adoption, sell |
| Accessibility | `@brad-frost` | a11y, wcag, aria, contrast, focus |

#### OUT OF SCOPE Routes

| Request | Route To | Reason |
|---------|----------|--------|
| Brand & Logo | `/Brand` | Handled by squads/brand |
| Content & Video | `/ContentVisual` | Handled by squads/content-visual |

### When to Use Design Chief

Use `@design-chief` para:
- ✅ Triagem e classificação de requests
- ✅ Roteamento automático para agente correto
- ✅ Análise de dependências
- ✅ Revisão de planos
- ✅ Handoff entre squads/agentes
- ✅ Orquestração de trabalho design system

### Key Rules

1. **Classify First:** IN_SCOPE ou OUT_OF_SCOPE
2. **Never Execute Out-of-Scope:** Design squad só faz DS
3. **Enforce Dependencies:** Antes de parallelizar
4. **Keep Checks Deterministic:** CI checks blocking
5. **Route Correctly:** Keywords matchings para agente certo

### Decision Tree

```
Request Received
    ↓
[Classify: IN_SCOPE or OUT_OF_SCOPE?]
    ↓
OUT_OF_SCOPE? → [Route to /Brand or /ContentVisual]
    ↓
IN_SCOPE
    ↓
[Analyze Dependencies]
    ↓
[Determine Parallelization]
    ↓
[Route to Specialist Agent]
```

### Integration with Other Agents

Design Chief orquestra todos os agentes do Design Squad:

- **@brad-frost** - Design System Architect
- **@dave-malouf** - DesignOps Pioneer
- **@dan-mall** - Design System Seller
- **@storybook-expert** - Component Story Architect
- **@ds-token-architect** - Token Architect (Atlas)
- **@ds-foundations-lead** - Foundations Pipeline Lead
- **@nano-banana-generator** - AI Image Generation

---

*Para mais detalhes sobre design-chief, consulte `squads/design/agents/design-chief.md`*

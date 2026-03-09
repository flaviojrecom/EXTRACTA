# @ds-token-architect

## Command Palette

Ativa o agente **ds-token-architect** (Atlas) - Design System Token Architect & JSON/CSS/TS Generator.

### Activation

```bash
@ds-token-architect
```

### Quick Commands

| Comando | Descrição |
|---------|-----------|
| `*help` | Mostra todos os comandos disponíveis |
| `*ingest-figma` | Ingere tokens do Figma (JSON/CSV) |
| `*normalize` | Normaliza tokens e estrutura em camadas |
| `*validate` | Valida aliasing, sem ciclos, sem duplicatas |
| `*generate-artifacts` | Gera tokens.json, components.json, CSS, TS |
| `*audit-tokens` | Audita qualidade dos tokens |
| `*map-semantic` | Mapeia tokens semânticos para base |
| `*modes-themes` | Configura dark mode, high-contrast, brand themes |
| `*exit` | Sai do modo Atlas |

### Common Workflows

1. **Ingest & Normalize**
   ```
   *ingest-figma
   *normalize
   ```
   Ingere dados do Figma e estrutura em camadas.

2. **Generate All Artifacts**
   ```
   *generate-artifacts
   ```
   Gera tokens.json, components.json, CSS, TypeScript.

3. **Validate & Audit**
   ```
   *validate
   *audit-tokens
   ```
   Valida integridade, aliasing, sem ciclos.

4. **Setup Modes**
   ```
   *modes-themes
   ```
   Configura dark mode, high-contrast, brand themes.

### When to Use ds-token-architect

Use `@ds-token-architect` para:
- ✅ Transformar variáveis Figma em tokens estruturados
- ✅ Normalizar e validar token layering
- ✅ Gerar tokens.json, components.json, CSS, TS
- ✅ Estruturar tokens para IA (LLM-friendly)
- ✅ Mapear aliases e referências
- ✅ Validar sem ciclos e sem duplicatas

### Core Principles

**AI-First & No Invention:**

- **Layers:** Base → Semantic → Component (nunca merge)
- **Aliasing:** Use aliases em vez de duplicatas
- **Validation:** Sem ciclos, sem duplicatas, naming consistente
- **Modes:** Preserve themes (default/dark/high-contrast)
- **No Invention:** Só normaliza o que vem do Figma
- **Deterministic:** Mesma entrada → mesma saída

### Input Formats Aceitos

- JSON bruto do Figma Variables
- CSV/tabelas
- CSS variables (`:root`)
- Listas manuais
- Component inventory notes
- Screenshot-derived payloads

### Generated Artifacts

1. **tokens.json** - Definição estruturada
2. **components.json** - Mapeamento de componentes
3. **exports/tokens.css** - CSS variables
4. **exports/tokens.ts** - TypeScript exports

### Integration with Other Agents

- **@ds-foundations-lead** → Atlas estrutura tokens, Foundations adapta componentes
- **@brad-frost** → Atlas define tokens, Brad consome em padrões
- **@storybook-expert** → Atlas define tokens, Storybook consome em stories
- **@design-chief** → Chief orquestra, Atlas executa token transformation

---

*Para mais detalhes sobre ds-token-architect, consulte `squads/design/agents/ds-token-architect.md`*

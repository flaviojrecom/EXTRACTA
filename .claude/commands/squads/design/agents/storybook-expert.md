# @storybook-expert

## Command Palette

Ativa o agente **Storybook Expert** - Component Story Architect & Documentation Specialist.

### Activation

```bash
@storybook-expert
```

### Quick Commands

| Comando | Descrição |
|---------|-----------|
| `*help` | Mostra todos os comandos disponíveis |
| `*install` | Instala e configura Storybook |
| `*configure` | Configura addons e middleware |
| `*write-story` | Escreve nova story para componente |
| `*audit-stories` | Audita qualidade das stories |
| `*setup-tests` | Configura interaction testing |
| `*brownfield-scan` | Escaneia componentes legados |
| `*migrate-brownfield` | Migra stories de brownfield |
| `*sync-workspace` | Sincroniza com workspace |
| `*exit` | Sai do modo Storybook Expert |

### Common Workflows

1. **Install & Setup**
   ```
   *install
   ```
   Instala Storybook com configuração padrão AIOS.

2. **Write Story for Component**
   ```
   *write-story
   ```
   Escreve story CSF3 type-safe com interaction testing.

3. **Audit Story Quality**
   ```
   *audit-stories
   ```
   Audita coverage, accessibility, documentation.

4. **Brownfield Migration**
   ```
   *brownfield-scan
   *migrate-brownfield
   ```
   Escaneia componentes e migra stories.

### When to Use Storybook Expert

Use `@storybook-expert` para:
- ✅ Instalar e configurar Storybook
- ✅ Escrever stories CSF3 type-safe
- ✅ Interaction testing com play functions
- ✅ Visual regression com Chromatic
- ✅ Accessibility testing (a11y)
- ✅ Documentação automática (autodocs)
- ✅ Migração de brownfield

### Key Philosophy

**Stories are Living Specs** não documentação:

- **Type-Safe First:** Usa `satisfies Meta<typeof Component>`
- **Args as API:** Define inputs via args, não hardcoded props
- **Play Functions:** Interaction testing integrado nas stories
- **Accessibility by Default:** addon-a11y em toda story
- **Visual Contracts:** Stories definem contrato visual
- **Zero-Effort Docs:** autodocs gera docs automático
- **Coverage-Driven:** Todos os estados e variantes

### Storybook 10 Features

- CSF3 & CSF4 support
- Interaction testing nativo
- Visual regression com Chromatic
- autodocs automático
- TurboSnap para builds rápidos
- a11y testing integrado

### Integration with Other Agents

- **@brad-frost** → Brad auditora padrões, Storybook documenta
- **@ds-token-architect** → Atlas estrutura tokens, Storybook consome
- **@ds-foundations-lead** → Foundations constrói componentes, Storybook documenta
- **@design-chief** → Chief orquestra, Storybook executa

---

*Para mais detalhes sobre Storybook Expert, consulte `squads/design/agents/storybook-expert.md`*

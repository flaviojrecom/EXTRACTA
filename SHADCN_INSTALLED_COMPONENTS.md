# Shadcn Components Installed

## Instalados (22 componentes)

1. **alert-dialog** - Diálogo de alerta
2. **alert** - Alerta
3. **badge** - Badge/Tag
4. **button** - Botão
5. **card** - Card/Cartão
6. **checkbox** - Checkbox
7. **dialog** - Diálogo modal
8. **dropdown-menu** - Menu dropdown
9. **input** - Input de texto
10. **label** - Label
11. **popover** - Popover
12. **progress** - Barra de progresso
13. **scroll-area** - Área com scroll customizado
14. **select** - Select/Dropdown
15. **sheet** - Sheet (drawer lateral)
16. **skeleton** - Skeleton loader
17. **switch** - Toggle switch
18. **table** - Tabela
19. **tabs** - Abas/Tabs
20. **textarea** - Textarea
21. **toggle** - Toggle button
22. **tooltip** - Tooltip

## Localização
- **Path**: `web/components/ui/`
- **Aliases**: 
  - `@/components/ui` → componentes UI
  - `@/lib/utils` → utilitários

## Storybook
- Story criada para **Button**: `web/components/ui/button.stories.tsx`
- Storybook está configurado para pegar stories de: `web/components/**/*.stories.{ts,tsx}`

## Como usar

### Instalar novos componentes (se disponíveis)
```bash
cd /Users/flaviogoncalvesjr/Code/EXTRACTA/web
npx shadcn@latest add [component-name]
```

### Criar stories para componentes
```bash
# Crie um arquivo ComponentName.stories.tsx em web/components/ui/
# Exemplo já criado: button.stories.tsx
```

### Rodar Storybook
```bash
npm run storybook
```

### Usar componentes em código
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>Título</CardHeader>
      <CardContent>
        <Button>Clique aqui</Button>
      </CardContent>
    </Card>
  )
}
```

## Configuração
- **Preset**: radix-nova (Radix UI + Lucide icons)
- **Framework**: Next.js
- **Styling**: Tailwind CSS v4
- **CSS Variables**: Habilitadas para theming

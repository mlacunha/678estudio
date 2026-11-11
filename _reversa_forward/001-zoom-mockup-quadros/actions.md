# Actions: Zoom no Mockup de Quadros Personalizados

> Identificador: `001-zoom-mockup-quadros`
> Data: `2026-11-11`
> Roadmap: `_reversa_forward/001-zoom-mockup-quadros/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 7 |
| Paralelizáveis (`[//]`) | 1 |
| Maior cadeia de dependência | 6 |

## Fase 1, Preparação

<!-- Setup, scaffolding, funções puras e tipos desacoplados da interface. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar utilitário modular com funções puras para controle matemático de escala, limitação de arraste (pan limits), zoom por passos e cálculo euclidiano de pinch | - | `[//]` | `src/utils/mockupZoom.ts` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Testes unitários do motor de zoom com Vitest garantindo determinismo e ausência de regressão. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T002 | Implementar testes unitários Vitest para `mockupZoom.ts` validando clamp de zoom (1.0x a 4.0x), limites da caixa de visão (bounding box), passos de ampliação e detecção de gestos | T001 | - | `src/utils/mockupZoom.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

<!-- Estrutura HTML/CSS e lógica central de ampliação do mockup. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Adicionar botão flutuante de ampliação no preview do quadro e a marcação semântica do modal (`<dialog>` acessível ou overlay) contendo viewport de visualização em alta definição | T001 | - | `src/components/customizers/Frame.astro` | 🟢 | `[X]` |
| T004 | Implementar o controlador de ciclo de vida do modal (abertura, foco acessível, tecla ESC, espelhamento do canvas 1600x1100 e fechamento limpo) | T003 | - | `src/components/customizers/Frame.astro` | 🟢 | `[X]` |
| T005 | Integrar os controles de interação (botões Zoom +, Zoom -, Redefinir 1:1, drag com mouse, scroll wheel e pinch-to-zoom móvel via CSS translate3d/scale) | T002, T004 | - | `src/components/customizers/Frame.astro` | 🟢 | `[X]` |

## Fase 4, Integração

<!-- Acoplamento estrito e reatividade com o restante do personalizador. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Assegurar que atualizações dinâmicas de arte, ambiente e moldura feitas no personalizador sincronizem instantaneamente o mockup ampliado sem reiniciar ou desconfigurar os dados de orçamento do WhatsApp | T005 | - | `src/components/customizers/Frame.astro` | 🟢 | `[X]` |

## Fase 5, Polimento

<!-- Acessibilidade, temas e refinamento responsivo. -->

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Refinar contraste, rótulos ARIA para leitores de tela, compatibilidade visual com tema claro e escuro, e garantia de ausência de overflow horizontal em telas móveis | T006 | - | `src/components/customizers/Frame.astro` | 🟢 | `[X]` |

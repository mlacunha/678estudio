# Roadmap: Zoom no Mockup de Quadros Personalizados

> Identificador: `001-zoom-mockup-quadros`
> Data: `2026-11-11`
> Requirements: `_reversa_forward/001-zoom-mockup-quadros/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Implementar a capacidade de inspeção e ampliação visual do mockup de quadros diretamente sobre o componente [`Frame.astro`](file:///d:/Projetos/site678Estudio/src/components/customizers/Frame.astro). A solução consiste em:
1. Inserir um gatilho de ação discreto (ícone/botão "Ampliar" flutuante e suporte a clique direto no container do canvas `frame-stage-canvas`).
2. Adicionar uma estrutura modal acessível (`<dialog>` ou overlay semântico) contendo um viewport ampliado espelhado do canvas de 1600 × 1100 px.
3. Gerenciar um estado isolado de visualização (escala de 1x a 4x, offsets de translação X/Y e flags de arrasto).
4. Suportar controles táteis de pinça (pinch-to-zoom) e gestos de pan no mobile, além de botões flutuantes de Zoom (+), Zoom (-), Reset e Fechar.
5. Garantir desacoplamento estrito em relação à personalização do produto (não altera o recorte, margens ou dados do orçamento).

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|---|---|---|
| I. Não-Destrutivo | Preserva 100% da lógica e do pipeline existente de renderização em 5 camadas | Respeita 🟢 |
| II. Performance Mobile-First | Sem adição de dependências pesadas; manipulação de transform via CSS matrix/translate3d e Canvas direto | Respeita 🟢 |
| III. Acessibilidade | Modal com foco gerenciado, suporte a teclado (ESC, teclas +/-) e tags ARIA | Respeita 🟢 |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|---|---|---|---|:---:|
| D-01 | Reutilização do Bitmap do Canvas Existente | O `frame-stage-canvas` já compõe o ambiente e a moldura em alta definição (1600 × 1100). Usar sua renderização evita criar um segundo pipeline de renderização duplicado. | Criar segundo canvas WebGL ou duplicar o loop de renderização (descartado por sobrecarga desnecessária). | 🟢 |
| D-02 | Modal com `<dialog>` nativo ou Overlay Acessível | O modal nativo HTML5 oferece suporte pronto a backdrop, foco e tecla ESC. | Bibliotecas de terceiros como SweetAlert ou Fancybox (descartadas para evitar dependências). | 🟢 |
| D-03 | Transformação via CSS GPU (`scale` e `translate3d`) | Oferece taxa de quadros suave de 60fps em dispositivos móveis durante o arraste e pinça. | Re-rasterização contínua do canvas a cada pixel de movimento (descartado por consumo de CPU). | 🟢 |
| D-04 | Faixa de Zoom Limitada (1x a 4x) | 1x garante visão completa do ambiente; 4x permite inspecionar nitidamente a textura da madeira e detalhes da arte sem pixelização excessiva. | Zoom infinito ou desprovido de limites. | 🟢 |

## 4. Premissas

Nenhuma premissa duvidosa adotada (`[DÚVIDA]` = 0).

## 5. Delta arquitetural

| Componente | Tipo de Mudança | Descrição |
|---|---|---|
| [`src/components/customizers/Frame.astro`](file:///d:/Projetos/site678Estudio/src/components/customizers/Frame.astro) | Adição / Refatoração Local | Adição do botão de gatilho, marcação HTML do modal de zoom e rotinas TypeScript cliente de controle de visualização (pan/zoom/pinch). |
| [`src/utils/customizer.ts`](file:///d:/Projetos/site678Estudio/src/utils/customizer.ts) | Intocado | Funções de cálculo métrico e WhatsApp permanecem idênticas. |
| Módulo Caneca 3D & Agendas | Intocado | Zero impacto colateral em outros produtos. |

## 6. Delta de dados

Nenhum dado é persistido em banco de dados. Trata-se de funcionalidade 100% client-side efêmera de visualização.

## 7. Critérios de pronto

- [x] O usuário consegue abrir a visualização ampliada clicando no botão dedicado ou no canvas da prévia.
- [x] A visualização reflete com precisão a imagem da arte, ambiente, margens e cor de moldura selecionados.
- [x] Controles de zoom (+ e -), reset e fechar funcionam via mouse, touch e teclado.
- [x] É possível arrastar a imagem quando o zoom for maior que 1x.
- [x] O fechamento do modal restaura o foco e não afeta a personalização da peça nem o botão do WhatsApp.
- [x] Testes unitários do repositório continuam passando (`pnpm test`), Astro Check com 0 erros e build bem-sucedido.


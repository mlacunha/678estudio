# Personalizador 3D de Canecas — Tarefas de Implementação

> Tarefas executáveis para reproduzir a unit `customizer-caneca-3d` a partir do legado.

## Pré-requisitos
- [x] Biblioteca `three` instalada e disponível no client bundle

## Tarefas
- [x] **T-01**: Implementar utilitários matemáticos e cálculo de arco cilíndrico em `customizer.ts`.
  - Origem no legado: [`src/utils/customizer.ts:6-21`](file:///d:/Projetos/site678Estudio/src/utils/customizer.ts#L6-L21)
  - Critério de pronto: Função `getMugPrintBand` converte larguras métricas em arcos radianos precisos. 🟢
- [x] **T-02**: Criar cena 3D Three.js e controles de rotação no componente `Mug.astro`.
  - Origem no legado: [`src/components/customizers/Mug.astro:213-350`](file:///d:/Projetos/site678Estudio/src/components/customizers/Mug.astro#L213-L350)
  - Critério de pronto: Caneca branca gira suavemente com arrasto de mouse/touch e teclado. 🟢
- [x] **T-03**: Implementar textura dinâmica e mapa planificado 2D.
  - Origem no legado: [`src/components/customizers/Mug.astro:250-320`](file:///d:/Projetos/site678Estudio/src/components/customizers/Mug.astro#L250-L320)
  - Critério de pronto: Atualização em tempo real ao carregar arquivo ou deslizar controles. 🟢
- [x] **T-04**: Integrar exportação de mockup e formatação de mensagem WhatsApp.
  - Origem no legado: [`src/utils/customizerClient.ts:20-60`](file:///d:/Projetos/site678Estudio/src/utils/customizerClient.ts#L20-L60)
  - Critério de pronto: Salva imagem em `/api/mockup/save` e redireciona para `wa.me`. 🟢

## Tarefas de Teste
- [x] **TT-01**: Teste unitário da função `getMugPrintBand` para as larguras 20, 21 e 22 cm.
- [x] **TT-02**: Teste de integridade da mensagem de WhatsApp formatada.


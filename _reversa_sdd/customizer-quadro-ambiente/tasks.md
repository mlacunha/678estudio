# Personalizador de Quadros em Ambientes — Tarefas de Implementação

> Tarefas executáveis para reproduzir a unit `customizer-quadro-ambiente` a partir do legado.

## Pré-requisitos
- [x] Fotografias dos ambientes de Sala e Escritório disponíveis em `/images/`

## Tarefas
- [x] **T-01**: Implementar utilitários de geometria e margens em `frameLayout.ts`.
  - Origem no legado: [`src/utils/frameLayout.ts:3-30`](file:///d:/Projetos/site678Estudio/src/utils/frameLayout.ts#L3-L30)
  - Critério de pronto: Função `getFrameLayout` calcula dimensões em pixels com fator de 15 px/cm. 🟢
- [x] **T-02**: Criar esteira de renderização Canvas 2D em 5 camadas em `Frame.astro`.
  - Origem no legado: [`src/components/customizers/Frame.astro:220-400`](file:///d:/Projetos/site678Estudio/src/components/customizers/Frame.astro#L220-L400)
  - Critério de pronto: Renderiza ambiente, moldura chanfrada, placa de madeira e foto recortada. 🟢
- [x] **T-03**: Implementar seletores de ambiente, orientação e cores de moldura.
  - Origem no legado: [`src/components/customizers/Frame.astro:80-165`](file:///d:/Projetos/site678Estudio/src/components/customizers/Frame.astro#L80-L165)
  - Critério de pronto: Alternância reativa sem recarregar a página. 🟢
- [x] **T-04**: Integrar exportação de mockup e disparo de link para WhatsApp.
  - Origem no legado: [`src/utils/customizerClient.ts`](file:///d:/Projetos/site678Estudio/src/utils/customizerClient.ts)
  - Critério de pronto: Envia imagem para `/api/mockup/save` e monta texto para WhatsApp. 🟢

## Tarefas de Teste
- [x] **TT-01**: Teste unitário de `getFrameLayout` conferindo limites de margens (0.5 a 8 cm).
- [x] **TT-02**: Teste de integridade de dimensões entre os modos Retrato e Paisagem.


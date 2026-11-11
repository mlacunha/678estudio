# Adendo: Zoom no Mockup de Quadros Personalizados

> Identificador: `001-zoom-mockup-quadros`  
> Data: `2026-11-11`  
> Cenário: `legado`

## Vigência

Vigente desde 2026-11-11.

## Resumo da entrega

Implementação da capacidade de ampliação e inspeção do mockup de quadros decorativos diretamente sobre o componente `Frame.astro`. Adiciona um gatilho de ampliação discreto e suporte a clique na imagem, abrindo um modal acessível (`<dialog>`) em tela cheia com zoom de 1.0x a 4.0x, pan por arraste de mouse, roda de rolagem e controles de toque com gestos de pinça (pinch-to-zoom) no celular. Mantém desacoplamento integral em relação à personalização do produto e ao fluxo de orçamento por WhatsApp. Todas as 7 ações do plano foram concluídas com aprovação total da suíte de testes Vitest (96 testes) e build Astro.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/architecture.md` | `customizer-quadro-ambiente` | `regra-nova` | O componente `Frame.astro` passa a incorporar a marcação do modal `#modal-mockup-zoom` e o controlador de visualização `setupMockupZoom()`, sincronizado ao canvas existente de 1600 × 1100 px. |
| `_reversa_sdd/architecture.md` | Utilitários Gerais / Personalizadores | `componente-novo` | Adição de `src/utils/mockupZoom.ts` contendo funções puras de escala, clamping e limites de translação (pan). |
| `_reversa_sdd/domain.md` | `customizer-quadro-ambiente` | `regra-nova` | O personalizador agora permite examinar detalhes da textura de madeira e da moldura ampliada em alta resolução sem modificar as medidas de corte, margens de madeira ou a arte final enviada para orçamento. |

## Regras sob vigilância

- **Watch Items Ativos:** `W001`, `W002`, `W003` descritos em [`_reversa_forward/001-zoom-mockup-quadros/regression-watch.md`](file:///d:/Projetos/site678Estudio/_reversa_forward/001-zoom-mockup-quadros/regression-watch.md).

## Fontes

- `_reversa_forward/001-zoom-mockup-quadros/requirements.md`
- `_reversa_forward/001-zoom-mockup-quadros/roadmap.md`
- `_reversa_forward/001-zoom-mockup-quadros/legacy-impact.md`
- `_reversa_forward/001-zoom-mockup-quadros/regression-watch.md`
- `_reversa_forward/001-zoom-mockup-quadros/actions.md`
- `_reversa_forward/001-zoom-mockup-quadros/progress.jsonl`


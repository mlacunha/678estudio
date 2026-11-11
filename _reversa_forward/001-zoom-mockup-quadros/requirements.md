# Requirements: Zoom no Mockup de Quadros Personalizados

> Identificador: `001-zoom-mockup-quadros`
> Data: `2026-11-11`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Permite ampliar e explorar visualmente em alta definição o mockup do quadro no ambiente através de um modal interativo com zoom (aproximação/afastamento), pan (arraste com mouse/touch) e suporte a gestos de pinça em dispositivos móveis, sem alterar a personalização física do produto nem o fluxo de solicitação de orçamento.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/customizer-quadro-ambiente/requirements.md#visão-geral` | Simulação contextual de quadros em madeira clara com molduras e proporção de 15 px/cm | 🟢 |
| `_reversa_sdd/customizer-quadro-ambiente/design.md#pipeline-de-renderização` | Renderização nativa do `frame-stage-canvas` em resolução 1600 × 1100 px em 5 camadas | 🟢 |
| `_reversa_sdd/domain.md#2.3-personalizador-de-quadros` | RN-QUA-01 a RN-QUA-04: Proporção áurea 30 × 40 cm, margens de 0.5 a 8 cm e cores de moldura | 🟢 |
| `_reversa_sdd/code-analysis.md#2.4-módulo-customizer-quadro-ambiente` | Controles de enquadramento da arte desvinculados da visualização de ambiente | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Cliente / Decorador | Examinar os detalhes da textura da madeira e da fotografia na moldura | Clica no botão de ampliação ou no próprio mockup para abrir a visualização detalhada em tela cheia |
| Usuário Mobile | Inspecionar a peça de perto na tela pequena do smartphone | Abre o modal e usa gestos de pinça ou duplo toque para aproximar a visão do quadro na parede |

## 4. Regras de negócio novas ou alteradas

1. **RN-ZOM-01 (Invariância da Personalização)**: A manipulação de zoom e pan no modal de inspeção afeta estritamente a câmera/visualizador temporário de tela. Não altera a escala da arte (slider de zoom da foto), o recorte horizontal/vertical da madeira, a cor da moldura ou a exportação para o WhatsApp. 🟢
   - Origem no legado: `_reversa_sdd/customizer-quadro-ambiente/requirements.md`
   - Tipo: nova

2. **RN-ZOM-02 (Fidelidade do Mockup Ampliado)**: A imagem renderizada no modal de zoom deve refletir exatamente o estado corrente do `frame-stage-canvas` (mesmo ambiente selecionado, mesma orientação, mesma foto enviada, mesmas margens e moldura). 🟢
   - Origem no legado: `src/components/customizers/Frame.astro:51`
   - Tipo: nova

3. **RN-ZOM-03 (Limites de Zoom do Mockup)**: O zoom do visualizador opera no intervalo fechado de 100% (1x - enquadramento original) até 400% (4x - inspeção microscópica dos veios da madeira e detalhes da estampa). 🟢
   - Origem no legado: Requisito de usabilidade
   - Tipo: nova

4. **RN-ZOM-04 (Restaurabilidade Instantânea)**: Deve haver um controle acessível de reset para retornar a escala a 1x e recentralizar o mockup na tela. 🟢
   - Origem no legado: Requisito de usabilidade
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Ação de abertura da ampliação | Must | Botão acessível discreto sobre o preview do mockup e clique/toque no canvas abrem o modal | 🟢 |
| RF-02 | Modal de inspeção responsivo | Must | Modal em tela cheia ou overlay centralizado com backdrop escurecido, fechamento por ESC, botão fechar (X) e clique fora | 🟢 |
| RF-03 | Controles de Zoom In / Zoom Out | Must | Botões flutuantes (+) e (-) que aumentam e diminuem o fator de escala visual em passos incrementais | 🟢 |
| RF-04 | Arraste (Pan) da visualização | Must | Quando ampliado (> 1x), o usuário pode arrastar o mockup livremente com cursor `grab`/`grabbing` ou swipe touch | 🟢 |
| RF-05 | Botão de redefinição (Reset) | Must | Botão que restaura o zoom para 100% e zera os offsets de arraste | 🟢 |
| RF-06 | Gestos de pinça e roda do mouse | Should | Suporte a pinch-to-zoom em telas de toque e scroll com wheel do mouse sobre a imagem | 🟢 |
| RF-07 | Preservação de acessibilidade e foco | Must | `aria-modal="true"`, armadilha de foco, suporte a teclado (ESC fecha, +/- amplia) e rótulos acessíveis | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Zero recriação de renderizadores: utiliza o bitmap já renderizado em `frame-stage-canvas` | `src/components/customizers/Frame.astro:51` | 🟢 |
| Leveza | Implementação puramente em Vanilla TypeScript sem adicionar bibliotecas pesadas de terceiros | Diretriz do projeto e performance mobile | 🟢 |
| Tema | Compatibilidade visual com Dark e Light mode do design system existente | `src/styles/global.css` e tokens Tailwind | 🟢 |
| Isolamento | Preservação total dos módulos de Canecas e Agendas sem interferência colateral | `_reversa_sdd/traceability/spec-impact-matrix.md` | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Abertura do modal de ampliação
  Dado que o usuário está no personalizador de quadros com uma arte e moldura configuradas
  Quando clica no botão "Ampliar Mockup" ou no canvas da prévia
  Então um modal em tela cheia deve se abrir exibindo o mockup exatamente como configurado
  E os controles de zoom (+, -, reset e fechar) devem estar visíveis

Cenário: Zoom e deslocamento do mockup
  Dado que o modal de ampliação está aberto
  Quando o usuário clica no botão de Zoom In (+) ou usa a roda do mouse
  Então a imagem do ambiente e do quadro deve ser ampliada
  E o usuário deve conseguir arrastar a visualização para inspecionar os cantos da moldura

Cenário: Fechamento com preservação da personalização
  Dado que o usuário inspecionou o mockup ampliado no modal
  Quando pressiona a tecla ESC ou clica no botão de fechar (X)
  Então o modal deve se fechar
  E os sliders de margem, zoom da arte e cor da moldura devem permanecer inalterados
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02, RF-03, RF-04, RF-05 | Must | Núcleo da experiência de inspeção solicitada pelo usuário |
| RF-06 | Should | Refinamento ergonômico em dispositivos móveis e desktop |
| RF-07 | Must | Conformidade de acessibilidade e padrões de qualidade do projeto |

## 9. Esclarecimentos

Não há pendências de escopo em aberto. O escopo restringe-se estritamente à inspeção visual do mockup no componente [`Frame.astro`](file:///d:/Projetos/site678Estudio/src/components/customizers/Frame.astro).


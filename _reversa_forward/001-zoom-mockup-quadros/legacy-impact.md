# Impacto no Legado: Zoom no Mockup de Quadros

> Identificador: `001-zoom-mockup-quadros`  
> Data: `2026-11-11`  
> Política de edição: `allowLegacyEdits: true` com caminhos liberados: `["src/utils/mockupZoom*", "src/components/customizers/Frame.astro"]`

## 1. Tabela de Impacto

| Arquivo afetado | Componente (`_reversa_sdd/architecture.md`) | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/utils/mockupZoom.ts` | Utilitários Gerais / Personalizadores | `componente-novo` | LOW | Funções puras matemáticas de escala e pan limits, 100% testadas e desacopladas |
| `src/utils/mockupZoom.test.ts` | Testes / Vitest | `componente-novo` | LOW | Cobertura de testes unitários para a lógica de zoom |
| `src/components/customizers/Frame.astro` | `customizer-quadro-ambiente` | `regra-nova` | LOW | Inclusão de modal acessível para inspeção visual sem alterar a lógica de renderização em 5 camadas |

## 2. Diff Conceitual por Componente

### `customizer-quadro-ambiente`
- **Antes**: O personalizador renderizava o quadro no canvas de 1600 × 1100 px em container com proporção 16:11, mas não disponibilizava mecanismo de inspeção ampliada para examinar detalhes da madeira ou arte.
- **Depois**: Mantém o mesmo canvas e pipeline de 5 camadas intacto, adicionando um botão discreto "Ampliar" e clique na imagem que abre um `<dialog>` em tela cheia com suporte a zoom de 1.0x a 4.0x, pan tátil/mouse, scroll wheel e pinch-to-zoom no mobile. O fechamento restaura o foco e não afeta a personalização nem o link de orçamento no WhatsApp.

## 3. Regras Preservadas

- **RF-QUADRO-01** 🟢: Renderização em 5 camadas (parede, sombra, paspatur, arte sublimada em madeira clara, moldura chanfrada).
- **RF-QUADRO-02** 🟢: Orientação retrato e paisagem (30 × 40 cm).
- **RF-QUADRO-03** 🟢: Cores de moldura (preta, branca, marrom).
- **RF-QUADRO-04** 🟢: Margens de madeira configuráveis com espessura simétrica por eixo.
- **RF-QUADRO-05** 🟢: Sublimação com perfil de madeira e veios orgânicos preservados.
- **RF-ORCAMENTO-01** 🟢: Envio de dados e link temporário para o WhatsApp sem alterações.

## 4. Regras Modificadas

- **Nenhuma regra existente foi quebrada, alterada ou rebaixada.** A feature introduz uma extensão puramente aditiva e não-destrutiva de usabilidade.


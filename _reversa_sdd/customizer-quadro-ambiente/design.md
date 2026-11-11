# Personalizador de Quadros em Ambientes — Design Técnico

> Especificação técnica da unit `customizer-quadro-ambiente`. Foca no COMO a unit é construída.

## Interface

### Componentes e Páginas
- `src/pages/personalizar/quadro.astro`: Rota SSR que hospeda o simulador.
- `src/components/customizers/Frame.astro`: Componente visual com layout em grid, canvas de palco (`frame-stage-canvas`) e controles de estilização.

### Utilitários de Layout (`src/utils/frameLayout.ts`)

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `FRAME_ORIENTATIONS` | Constante | Objeto com dimensões Retrato e Paisagem | `widthCm: 30`, `heightCm: 40` |
| `FRAME_COLORS` | Constante | Cores `black`, `white`, `brown` | Valores hexadecimais de preenchimento e borda |
| `FRAME_MARGINS` | Constante | `min: 0.5`, `max: 8`, `step: 0.5` | Limites em cm |
| `getFrameLayout` | `(orientation, horizCm, vertCm)` | Objeto de dimensões calculadas em pixels | Calcula moldura, chanfro, placa e arte útil |

## Pipeline de Renderização em 5 Camadas (Canvas 2D)
O canvas principal opera na resolução nativa de $1600 \times 1100$ pixels:
1. **Camada 1 (Ambiente)**: Desenho da imagem base do ambiente (sala contemporânea ou escritório com perspectiva frontal).
2. **Camada 2 (Sombra Projetada)**: Aplicação de `shadowBlur` e `shadowColor` simulando a projeção suave de luz natural da parede.
3. **Camada 3 (Moldura Externa e Chanfro)**: Desenho da moldura retangular com cor sólida selecionada e chanfro interno (`edge`) dando profundidade de profundidade de caixa alta.
4. **Camada 4 (Prancha de Madeira Clara)**: Preenchimento com textura de madeira clara com veios sutis, correspondente às margens selecionadas pelo cliente.
5. **Camada 5 (Arte e Fotografia Sublimada)**: Renderização da imagem enviada pelo usuário com recorte `ctx.clip()`, aplicando zoom centralizado e offsets horizontais e verticais.

## Riscos e Lacunas
- 🟡 As imagens de fundo dos ambientes precisam ter proporção idêntica de aspecto ($16:11$) para evitar distorção na parede.


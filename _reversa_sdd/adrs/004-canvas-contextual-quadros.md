# ADR-004: Simulação Contextual de Quadros em Ambientes via Canvas 2D

- **Status**: Aceito (Retroativo)
- **Data**: 2026-11-06
- **Autor**: Milton / Equipe 678 Estudio

## Contexto
Quadros decorativos dependem de contexto espacial e proporção com a mobília (sofás, mesas de escritório) para tomada de decisão de compra.

## Decisão
Criar o personalizador contextual de quadros (`Frame.astro`) utilizando uma esteira de composição em Canvas 2D HTML5 com proporção métrica exata de 15 pixels por centímetro. A prancha de madeira clara e as molduras (preta, branca ou marrom) são renderizadas sobre fotografias de alta resolução de ambientes reais (Sala Contemporânea e Escritório Elegante).

## Consequências
- **Positivas**:
  - Proporciona visão realista da escala da peça de 30 × 40 cm na parede.
  - Implementação leve e compatível universalmente em qualquer navegador móvel sem exigir Three.js.
- **Negativas**:
  - Imagens de ambiente de alta resolução aumentam o peso de download inicial da página de personalização.


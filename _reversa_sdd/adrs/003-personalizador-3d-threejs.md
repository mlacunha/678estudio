# ADR-003: Simulador 3D Interativo de Canecas com Three.js

- **Status**: Aceito (Retroativo)
- **Data**: 2026-11-06
- **Autor**: Milton / Equipe 678 Estudio

## Contexto
Canecas cilíndricas sofrem distorção perceptual quando visualizadas apenas em mockups planos 2D, gerando dúvidas dos clientes sobre o posicionamento da arte em relação à alça e às extremidades.

## Decisão
Implementar um componente visual interativo (`Mug.astro`) com **Three.js** utilizando geometria de cilindro aberto e malha de alça personalizada. A arte do usuário é mapeada dinamicamente via `CanvasTexture`, com cálculo de ângulo angular em radianos (`getMugPrintBand`), permitindo rotação completa de 360° em tempo real no navegador do cliente.

## Consequências
- **Positivas**:
  - Fidelidade visual extraordinária e sensação de produto tangível pelo comprador antes do pagamento.
  - Zero carga no servidor durante a renderização interativa 3D (executada via WebGL no cliente).
- **Negativas**:
  - Exige fallback visual gracioso para navegadores ou dispositivos móveis antigos sem suporte a WebGL.


# Investigação Técnica: Zoom no Mockup de Quadros

> Identificador: `001-zoom-mockup-quadros`

## 1. Inspeção da Implementação Atual

No arquivo [`src/components/customizers/Frame.astro`](file:///d:/Projetos/site678Estudio/src/components/customizers/Frame.astro), a renderização do quadro no ambiente é orquestrada pela função `renderStage()`, desenhando no elemento `<canvas id="frame-stage-canvas" width="1600" height="1100">`:
- O canvas é renderizado com resolução fixa de $1600 \times 1100$ pixels e exibido em um container responsivo com proporção `aspect-[16/11]` e classe `w-full h-full block`.
- A resolução de 1600 × 1100 px é muito superior à área de visualização visível em telas mobile (~360px a 390px de largura) e na coluna de preview desktop (~680px).
- **Conclusão Técnica**: O canvas já renderiza com densidade de pixels mais do que suficiente para suportar zoom de até 2.5x a 4x sem perda perceptível de nitidez ou necessidade de re-renderizar camadas.

## 2. Padrões de Interação e Gestos

### 2.1 Arraste (Pan)
- Quando `zoomScale > 1`, o usuário pode mover o viewport.
- O deslocamento horizontal e vertical deve ser limitado pelos limites da imagem ampliada para evitar que a imagem saia totalmente da tela (bounding box).
- No ponteiro do mouse: `mousedown` registra `startX/Y`; `mousemove` calcula $\Delta x, \Delta y$; `mouseup` desativa.

### 2.2 Zoom (Wheel e Botoeiras)
- Na roda do mouse (`wheel`), calcula-se `zoomScale += event.deltaY * -0.002`, com `clampValue(zoomScale, 1.0, 4.0)`.
- Nos botões (+) e (-), passos de $0.25$ ou $0.5$ proporcionam controle determinístico.

### 2.3 Gestos Táteis Móveis (Pinch-to-zoom)
- Quando `event.touches.length === 2`, calcula-se a distância euclidiana $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.
- A variação de distância entre eventos de touch determina o fator proporcional de aproximação ou afastamento.

## 3. Acessibilidade
- O modal deve possuir `role="dialog"`, `aria-label="Inspeção detalhada do mockup do quadro"` e fechar ao pressionar a tecla `Escape`.
- O elemento disparador de abertura deve conter `aria-haspopup="dialog"`.


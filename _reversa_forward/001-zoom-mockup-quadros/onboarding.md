# Onboarding e Roteiro de Validação Humana

> Feature: `001-zoom-mockup-quadros`

## Roteiro Passo a Passo de Teste Manual

### 1. Preparação
1. Abra o navegador na rota: `http://localhost:4321/personalizar/quadro`.
2. Observe o mockup padrão exibindo a arte de demonstração na Sala Contemporânea.

### 2. Abertura do Modal de Inspeção
3. Passe o cursor sobre o mockup da prévia e clique no botão **"Ampliar Mockup"** (ou clique diretamente na imagem da prévia).
4. Verifique se o modal escurecido abre cobrindo a tela com foco visível.
5. Confirme que o quadro e o ambiente estão perfeitamente visíveis em proporção 1:1.

### 3. Teste de Zoom e Arraste
6. Clique no botão de **Zoom In (+)**: a imagem deve se aproximar suavemente.
7. Use o mouse ou arraste com o dedo para mover a visão e examinar a moldura e a textura de madeira clara.
8. Role a roda do mouse (scroll wheel) para testar aproximação e afastamento graduais.
9. Clique no botão **"Restaurar" (1:1)**: a imagem deve recentralizar e voltar à escala normal.

### 4. Fechamento e Integridade
10. Pressione a tecla **ESC** (ou clique no botão **X** no topo do modal).
11. O modal deve se fechar suavemente.
12. Altere o ambiente para **"Escritório Elegante"**, mude a moldura para **"Branca"** e envie uma foto autoral.
13. Abra novamente o modal de ampliação: confirme que o modal reflete a foto nova, a moldura branca e o ambiente de escritório.
14. Confirme que o botão "Gerar prévia para orçamento" continua funcionando normalmente sem alterações no fluxo do WhatsApp.


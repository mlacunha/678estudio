# Regression Watch: Zoom no Mockup de Quadros

> Identificador: `001-zoom-mockup-quadros`  
> Data: `2026-11-11`

## 1. Watch Items

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|---|---|---|---|---|
| W001 | `Frame.astro` (Inspeção do Mockup) | O modal de ampliação deve abrir ao clicar no botão "Ampliar" ou no canvas da prévia | presença | Ausência do elemento `#modal-mockup-zoom` ou falha ao disparar `showModal()` |
| W002 | `Frame.astro` (Integridade de Personalização) | O zoom no modal não deve alterar os inputs de escala real da arte nem o orçamento do WhatsApp | presença | Modificação involuntária de `#slider-frame-scale` ou `#slider-frame-x/y` ao interagir com o modal |
| W003 | `mockupZoom.ts` (Limites de Escala) | O fator de zoom deve ser restrito entre 1.0x e 4.0x em todas as interações (botões, wheel e pinch) | presença | Escala inferior a 1.0 ou superior a 4.0 |

## 2. Histórico de Re-extrações

*(Vazio - será preenchido nas próximas execuções de `/reversa`)*

## 3. Arquivadas

*(Vazio)*

## 4. Observações

- A feature foi implementada com desacoplamento estrito entre visualização e domínio do produto.


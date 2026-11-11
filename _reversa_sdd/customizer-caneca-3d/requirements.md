# Personalizador 3D de Canecas — Requisitos

> Especificação de requisitos da unit `customizer-caneca-3d`. Foca no QUE a unit faz.

## Visão Geral
Simulador interativo em três dimensões de canecas de cerâmica branca resinada (325ml). Permite aos clientes carregar artes autorais, escolher faixas de largura de impressão, ajustar escala e enquadramento, girar o produto em 360° no espaço e enviar a cotação diretamente via WhatsApp.

## Responsabilidades
- Renderizar em tempo real um modelo 3D realista da caneca (cilindro cerâmico + alça ergonômica).
- Mapear a arte do usuário sobre a malha cilíndrica com preservação de proporção.
- Suportar larguras métricas de estampa de 20, 21 e 22 cm com altura fixa de 9 cm.
- Permitir rotação manual 360° via touch e mouse.
- Gerar snapshot de mockup e formatar link de conversão direta para o WhatsApp.

## Regras de Negócio
- **RN-CAN-01**: A caneca opera estritamente nas larguras de 20, 21 e 22 cm, mantendo altura de 9 cm. 🟢
- **RN-CAN-02**: A área da alça posiciona-se no ângulo de 90° ($\pi/2$), sendo mantida limpa e livre de estampa. 🟢
- **RN-CAN-03**: Os controles de deslocamento manual limitam-se a $\pm 800$ px (horizontal) e $\pm 350$ px (vertical). 🟢
- **RN-CAN-04**: O snapshot gerado para WhatsApp deve conter identificador único e ser salvo no servidor via `/api/mockup/save`. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|---|---|---|---|
| RF-01 | Renderizar caneca 3D | Must | Canvas WebGL exibe a malha cerâmica com iluminação ambiente e direcional |
| RF-02 | Upload de fotografia/estampa | Must | Input de arquivo lê JPG/PNG e atualiza a textura da caneca |
| RF-03 | Rotação 360° | Must | Arraste horizontal gira a caneca continuamente em torno do eixo Y |
| RF-04 | Ajuste de escala e posição | Must | Sliders alteram zoom e deslocamento X/Y em tempo real |
| RF-05 | Exportar prévia para WhatsApp | Must | Botão envia imagem base64 para `/api/mockup/save` e abre link formatado do WhatsApp |

## Critérios de Aceitação

```gherkin
Cenário: Envio de arte pelo usuário
  Dado que o usuário está na página "/personalizar/caneca"
  Quando faz o upload de uma imagem válida "arte.png"
  Então a textura do cilindro 3D deve ser atualizada imediatamente
  E o mapa planificado 2D inferior deve refletir a mesma estampa

Cenário: Seleção de largura de estampa
  Dado que o usuário seleciona a opção "22 × 9 cm"
  Quando a opção é clicada
  Então a faixa angular calculada em Three.js deve ser recalculada
  E a estampa deve cobrir um arco maior do corpo da caneca
```


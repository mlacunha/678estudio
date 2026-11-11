# Personalizador de Quadros em Ambientes — Requisitos

> Especificação de requisitos da unit `customizer-quadro-ambiente`. Foca no QUE a unit faz.

## Visão Geral
Simulador contextual de quadros com impressão por sublimação em pranchas de madeira clara de 30 × 40 cm. Permite ao usuário visualizar sua arte inserida em fotografias reais de interiores (Sala Contemporânea ou Escritório Elegante), alterar orientação, calibrar margens e cor da moldura, e exportar prévias para orçamento via WhatsApp.

## Responsabilidades
- Renderizar a composição fotorrealista em canvas 2D de alta resolução (1600 × 1100 px).
- Oferecer alternância dinâmica entre cenários de Sala e Escritório.
- Suportar orientações Retrato (30 × 40 cm) e Paisagem (40 × 30 cm).
- Permitir ajuste milimétrico de margens visíveis de madeira clara (0.5 a 8 cm por lado).
- Permitir seleção de molduras homologadas (Preta, Branca e Marrom).
- Oferecer controles de zoom (50% a 250%) e deslocamento X/Y da fotografia.

## Regras de Negócio
- **RN-QUA-01**: A peça padrão possui dimensão métrica de 30 × 40 cm (Retrato) ou 40 × 30 cm (Paisagem). 🟢
- **RN-QUA-02**: A escala de conversão métrica no canvas adota estritamente 15 pixels por centímetro (`pixelsPerCm = 15`). 🟢
- **RN-QUA-03**: As margens de madeira devem respeitar o intervalo de 0.5 cm a 8 cm com incremento de 0.5 cm. 🟢
- **RN-QUA-04**: Cores de moldura restritas a Preta (`#121316`), Branca (`#f1eee8`) e Marrom (`#583a2c`). 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|---|---|---|---|
| RF-01 | Alternar ambiente de fundo | Must | Clique nos botões altera o fundo entre Sala Contemporânea e Escritório Elegante |
| RF-02 | Upload de fotografia/arte | Must | Input de arquivo carrega a imagem do cliente e habilita controles de zoom |
| RF-03 | Alterar orientação | Must | Seletor muda entre Retrato e Paisagem, recalculando largura e altura |
| RF-04 | Ajustar margens de madeira | Must | Sliders horizontal e vertical alteram a área visível da placa de madeira |
| RF-05 | Alterar cor da moldura | Must | Seleção de cor atualiza a borda e o chanfro interno do quadro |
| RF-06 | Gerar prévia para orçamento | Must | Exporta o canvas montado e gera link de WhatsApp |

## Critérios de Aceitação

```gherkin
Cenário: Ajuste de margem horizontal
  Dado que o usuário está personalizando um quadro no modo Retrato
  Quando aumenta a margem horizontal de 5 cm para 7 cm
  Então a área da arte central deve reduzir proporcionalmente
  E a área visível de madeira clara nas laterais deve aumentar
```


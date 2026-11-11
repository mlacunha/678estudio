# ADR-005: Checkout e Conversão Direta via WhatsApp

- **Status**: Aceito (Retroativo)
- **Data**: 2026-11-06
- **Autor**: Milton / Equipe 678 Estudio

## Contexto
O estúdio trabalha com produtos personalizados artesanais sob encomenda, onde detalhes específicos (ajustes finos de foto, dedicatórias, tiragens personalizadas) demandam alinhamento consultivo prévio à produção. Gateways tradicionais de e-commerce adicionavam fricção excessiva e taxas desnecessárias.

## Decisão
Substituir o carrinho de compras tradicional por um funil de conversão direto para o WhatsApp oficial do estúdio. Ao clicar em "Gerar prévia para orçamento", a aplicação persiste a imagem gerada no servidor via `/api/mockup/save` e monta um link direto para `https://wa.me/55...` com mensagem pré-formatada contendo os parâmetros da peça e a URL do mockup.

## Consequências
- **Positivas**:
  - Conversão imediata e canal de comunicação humano direto com o cliente.
  - Eliminação de custos recorrentes de gateways de pagamento e simplificação do fluxo técnico.
- **Negativas**:
  - Dependência do atendimento humano para fechamento do pedido e cobrança via PIX/cartão.


# Histórias de Usuário — Fluxo de Conversão e Orçamento via WhatsApp

Especificação comportamental das jornadas de solicitação de orçamento e fechamento de pedidos.

---

## US-01: Solicitação de Orçamento de Caneca Personalizada em 3D

**Como** cliente interessado em uma caneca personalizada com minha foto ou arte corporativa,  
**Quero** visualizar a peça em 3D girando em 360° e clicar em "Gerar prévia para orçamento",  
**Para que** eu possa enviar a cotação diretamente pelo WhatsApp da empresa com a prévia anexada.

### Critérios de Aceitação:
1. **Dado** que ajustei o zoom e a posição da estampa na caneca 3D,
   **Quando** clico no botão "Gerar prévia para orçamento",
   **Então** o sistema deve congelar o frame do canvas 3D e enviar o snapshot para `/api/mockup/save`.
2. **Dado** que o snapshot foi salvo com sucesso,
   **Quando** a resposta retorna a URL pública do mockup,
   **Então** um botão com destaque para "Abrir WhatsApp com a prévia ↗" deve surgir na tela.
3. **Dado** que o usuário clica no link do WhatsApp,
   **Quando** o aplicativo ou web do WhatsApp abre,
   **Então** a mensagem deve vir pré-preenchida com o nome da peça, a URL do mockup e o pedido de cotação e prazos.

---

## US-02: Solicitação de Orçamento de Quadro no Ambiente

**Como** decorador ou cliente residencial,  
**Quero** testar a proporção de um quadro de 30 × 40 cm na minha sala ou escritório com molduras diferentes,  
**Para que** eu tenha certeza de que a peça harmoniza com meu espaço antes de efetuar o pagamento.

### Critérios de Aceitação:
1. **Dado** que selecionei a moldura preta e o ambiente "Sala Contemporânea",
   **Quando** clico em "Gerar prévia para orçamento",
   **Então** a composição em alta resolução ($1600 \times 1100$ px) é exportada e associada ao pedido.

---

## US-03: Cotação de Agenda Institucional

**Como** gestor de compras corporativas,  
**Quero** configurar o miolo da agenda anual da minha empresa com nossas cores e logotipo,  
**Para que** eu possa receber um PDF de amostra e orçamento para o lote de final de ano.

### Critérios de Aceitação:
1. **Dado** que configurei o ano, cores institucionais e fiz upload do logotipo vetorial,
   **Quando** clico em solicitar cotação,
   **Então** um registro com identificador unívoco é criado no banco de dados e a equipe comercial do estúdio recebe a notificação no painel de controle.


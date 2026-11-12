# Onboarding: Cadernos Personalizados (Receitas, Diário Pessoal e Livro de Memórias)

> Identificador: `004-cadernos-personalizados`
> Data: `2026-11-12`

## 1. Como Testar o Personalizador Público (`/personalizar/caderno`)

1. Na página inicial (`/`), localize a seção **Papelaria Personalizada** e confirme que continuam existindo exatamente 3 cards: **Agendas**, **Planners** e **Cadernos Personalizados**.
2. Clique em **Personalizar** no card **Cadernos Personalizados** para abrir `/personalizar/caderno`.
3. Teste os três modelos:
   - **Caderno de Receitas:** informe um título (ex.: *"Receitas da Família"*), escolha estilo e tipografia e clique em **Visualizar meu caderno**. Confira as 6 prévias reais (`Abertura`, `Equivalências`, `Índice de Receitas`, `Ficha de Receita` com Ingredientes em duas subcolunas superiores e Modo de Preparo em largura total abaixo, `Anotações Culinárias` e `Página Institucional`).
   - **Diário Pessoal:** selecione o modelo **Diário Pessoal**, informe o nome do proprietário e gere as prévias. Confira que o miolo é 100% não datado, com páginas de escrita livre pautadas e espaço de reflexão.
   - **Livro de Memórias:** selecione o modelo **Livro de Memórias**, preencha uma dedicatória opcional e gere as prévias. Confira a página de apresentação, dedicatória, sumário, página esquerda de acontecimento (fotografia, data, local e participantes) e página direita de relato.
4. Clique em **Solicitar orçamento pelo WhatsApp** para persistir o pedido no SQLite e abrir a referência pública `/caderno/orcamento/<id>`.

## 2. Como Homologar os PDFs A5 e a Impressão A4 Cut & Stack (`/admin/cadernos`)

1. Acesse `/admin` → clique em **Solicitações de cadernos** (`/admin/cadernos`) e abra o pedido gerado (`/admin/cadernos/<id>`).
2. Baixe o **PDF de produção (A5 original)** e verifique:
   - **Caderno de Receitas:** exatamente **140 páginas A5** (120 fichas numeradas da página 7 à 126).
   - **Diário Pessoal:** exatamente **160 páginas A5** não datadas.
   - **Livro de Memórias:** exatamente **120 páginas A5**, com as **52 aberturas duplas** iniciando na **página par 6** (esquerda: foto/data/local) e **página ímpar 7** (direita: relato) até as páginas **108 e 109**.
3. No painel **Preparação para Impressão A4 Manual (Cut & Stack)**:
   - Baixe o **PDF A4 — Frentes** e o **PDF A4 — Versos** (`35` folhas A4 para Receitas, `40` folhas A4 para Diário e `30` folhas A4 para Livro de Memórias).
   - Após imprimir frentes e versos e cortar a pilha ao meio em `148,5 mm`, posicione a pilha esquerda sobre a pilha direita para obter o miolo A5 completo na sequência exata `1..N`.


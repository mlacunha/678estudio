# Requirements: Cadernos Personalizados (Receitas, Diário Pessoal e Livro de Memórias)

> Identificador: `004-cadernos-personalizados`
> Data: `2026-11-12`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Esta entrega implementa a família comercial **Cadernos Personalizados** do **678 Estudio**, disponibilizando três modelos temáticos em formato A5 (**Caderno de Receitas** com 140 páginas, **Diário Pessoal** não datado com 160 páginas e **Livro de Memórias** com 120 páginas) em um único fluxo público de personalização, geração de prévias reais e solicitação de orçamento pelo canal de mensagens do estúdio. Além disso, integra a gestão dos pedidos ao painel administrativo e ao módulo compartilhado de imposição para impressão A4 com corte reto central (Cut & Stack), resolvendo a lacuna do terceiro card da linha de Papelaria Personalizada que até então encontrava-se em preparação.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/architecture.md#Visão Geral e Estilo Arquitetural` | Aplicação monolítica modular com renderização híbrida, persistência relacional local e motor de diagramação vetorial invocado sob demanda. | 🟢 |
| `_reversa_sdd/domain.md#2.1 Catálogo e Vitrine` | Regras de visibilidade pública (`RN-CAT-01`), ordenação (`RN-CAT-02`) e exclusividade de categoria (`RN-CAT-03`). | 🟢 |
| `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)` | Validação de contraste mínimo de `3:1` no papel branco (`RN-AGE-02`) e persistência de rascunho com prévias reais e logotipo (`RN-AGE-03`). | 🟢 |
| `_reversa_sdd/domain.md#2.5 Configurações do Estúdio` | Registro único (`id = 1`) com canais de atendimento do estúdio (`RN-CFG-01`, `RN-CFG-02`). | 🟢 |
| `_reversa_sdd/addenda/002-personalizador-planners.md#Resumo da entrega` | Preservação estrita dos 3 cards de Papelaria Personalizada (*Agendas*, *Planners* e *Cadernos Personalizados*), suporte a 3 estilos visuais, 3 famílias tipográficas e marca-d’água no miolo. | 🟢 |
| `_reversa_sdd/addenda/003-evolucao-agendas-e-impressao-a4.md#Resumo da entrega` | Página institucional final do 678 Estudio na última página par e módulo compartilhado de imposição A4 Cut & Stack (`Frentes`, `Versos` e `Calibração`). | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Cliente de Papelaria Personalizada | Personalizar um Caderno de Receitas, Diário Pessoal ou Livro de Memórias e solicitar orçamento. | Seleciona o modelo desejado no personalizador único, informa título/nome/dedicatória, escolhe estilo visual, tipografia, cores e logomarca opcional, inspeciona 6 prévias reais do miolo A5 e envia o pedido de orçamento. |
| Operador Administrativo / Produção (678 Estudio) | Localizar o pedido do cliente e produzir o miolo físico em folhas A5 a partir de papel A4. | Acessa a listagem administrativa de solicitações de cadernos, abre os detalhes do pedido, confere as especificações e baixa o documento A5 original ou os documentos A4 de Frentes e Versos no modo Cut & Stack. |

## 4. Regras de negócio novas ou alteradas

1. **RN-01 (Preservação dos Três Cards Comerciais e Ativação da Família Cadernos):** A categoria Papelaria Personalizada deve manter exatamente três cards na vitrine pública (*Agendas*, *Planners* e *Cadernos Personalizados*). O card *Cadernos Personalizados* deixa o estado *"Em preparação"* e passa a direcionar o cliente para o personalizador único `/personalizar/caderno`, onde os três modelos (*Caderno de Receitas*, *Diário Pessoal* e *Livro de Memórias*) são selecionados. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2.1 Catálogo e Vitrine` e `_reversa_sdd/addenda/002-personalizador-planners.md#Resumo da entrega`
   - Tipo: alterada
2. **RN-02 (Estrutura e Espaço de Escrita do Caderno de Receitas — 140 Páginas A5):** O modelo **Caderno de Receitas** deve conter exatamente **140 páginas A5** (70 folhas A5 = 35 folhas A4 em Cut & Stack), compostas por: Página 1 de identificação personalizada, Página 2 de guia de medidas e equivalências culinárias, Páginas 3 a 6 de índice numerado para 120 receitas (4 páginas), Páginas 7 a 126 com **120 fichas estruturadas de receitas** (1 receita por página A5 contendo Nome da Receita, Tempo de Preparo, Rendimento, Ingredientes, Modo de Preparo e Observações/Dicas), Páginas 127 a 139 para anotações culinárias (13 páginas) e Página 140 com a identificação institucional do 678 Estudio. A disposição entre Ingredientes e Modo de Preparo deve ser avaliada comparando-se a organização vertical (Ingredientes na parte superior e Modo de Preparo abaixo em largura integral) e a organização em duas colunas, adotando a composição que maximize a largura de linha e a legibilidade para escrita manual em A5. 🟢
   - Origem no legado: n/a
   - Tipo: nova
3. **RN-03 (Estrutura Não Datada do Diário Pessoal — 160 Páginas A5):** O modelo **Diário Pessoal** deve ser estritamente não datado (permitindo início em qualquer dia do ano, sem calendários anuais, metas corporativas ou grades de Agenda/Planner) e conter exatamente **160 páginas A5** (80 folhas A5 = 40 folhas A4 em Cut & Stack), compostas por: Página 1 de apresentação personalizada e identificação do proprietário, Página 2 de intenções e ponto de partida, Páginas 3 a 150 de escrita livre pautada com cabeçalho discreto para data opcional e quadro inferior para reflexões do dia (148 páginas), Páginas 151 a 159 para citações, pensamentos e memórias breves (9 páginas) e Página 160 com a identificação institucional do 678 Estudio. 🟢
   - Origem no legado: n/a
   - Tipo: nova
4. **RN-04 (Paridade de Aberturas Duplas no Livro de Memórias — 120 Páginas A5):** O modelo **Livro de Memórias** deve conter exatamente **120 páginas A5** (60 folhas A5 = 30 folhas A4 em Cut & Stack) e garantir que cada um dos **52 registros de acontecimentos** ocupe uma abertura dupla real no caderno aberto: a **página par (à esquerda)** deve exibir título do acontecimento, data, local, participantes e espaço emoldurado para fotografia; a **página ímpar imediatamente seguinte (à direita)** deve exibir o espaço pautado para relato e recordações do mesmo acontecimento. A sequência obrigatória é: Página 1 (ímpar) de apresentação, Página 2 (par) de dedicatória, Página 3 (ímpar) de guia afetivo/epígrafe, Páginas 4 e 5 (abertura dupla par-ímpar) de sumário numerado dos 52 momentos, **Páginas 6 a 109** com as **52 aberturas duplas de acontecimentos** — iniciando na página par `6` (esquerda) com seu par na página ímpar `7` (direita) até a página par `108` e ímpar `109` —, Páginas 110 a 119 (10 páginas) de recordações especiais e anotações, e Página 120 (par) com a identificação institucional do 678 Estudio. 🟢
   - Origem no legado: n/a
   - Tipo: nova
5. **RN-05 (Personalização Compartilhada e Escopo Básico de Apresentação):** Os três modelos compartilham as mesmas opções de estilo visual (*Clássico*, *Comercial* e *Feminino*), tipografia (*Moderna*, *Geométrica* e *Editorial*), cores personalizadas com contraste mínimo de `3:1` no papel branco (`RN-AGE-02`), título personalizado, nome de identificação, dedicatória/epígrafe opcional e envio de imagem/logomarca até 2 MB com opção de marca-d’água no miolo. Não deve ser criado editor complexo de capas nesta etapa. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)`
   - Tipo: nova
6. **RN-06 (Persistência, Administração e Imposição A4 Cut & Stack):** Toda solicitação de orçamento de caderno deve persistir a configuração auditada e as 6 prévias PNG no banco local, gerar página pública de referência e disponibilizar no painel administrativo tanto o documento A5 original quanto os documentos impostos em A4 paisagem (`297 × 210 mm`, duas páginas A5 retrato lado a lado para corte reto central em `148,5 mm`, sem dobras de livreto) nos modos Frentes, Versos e Folha de Calibração. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)` e `_reversa_sdd/addenda/003-evolucao-agendas-e-impressao-a4.md#Resumo da entrega`
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve ativar o card comercial *Cadernos Personalizados* na vitrine de Papelaria Personalizada apontando para `/personalizar/caderno`, mantendo exatamente 3 cards na categoria. | Must | A vitrine exibe *Agendas*, *Planners* e *Cadernos Personalizados*, todos com link ativo de personalização. | 🟢 |
| RF-02 | O sistema deve disponibilizar em `/personalizar/caderno` um personalizador compartilhado permitindo escolher o modelo (*Caderno de Receitas*, *Diário Pessoal* ou *Livro de Memórias*), estilo visual, tipografia, título personalizado, nome do proprietário, dedicatória opcional, cores e imagem/logomarca com opção de marca-d’água. | Must | O formulário valida todas as entradas e adapta os textos orientadores e as 6 seções de prévia ao modelo selecionado. | 🟢 |
| RF-03 | O motor de diagramação deve gerar o miolo A5 do **Caderno de Receitas** com exatamente 140 páginas (abertura, equivalências, 4 páginas de índice para 120 receitas, 120 fichas de receitas avaliadas para máximo aproveitamento de escrita manual de Ingredientes, Preparo, Tempo, Rendimento e Dicas, 13 páginas de notas e 1 página institucional final). | Must | O documento A5 compilado para `caderno-receitas` possui exatamente 140 páginas e apresenta as 6 prévias da modalidade. | 🟢 |
| RF-04 | O motor de diagramação deve gerar o miolo A5 não datado do **Diário Pessoal** com exatamente 160 páginas (abertura com identificação do proprietário, página de intenções, 148 páginas de escrita livre pautada com data opcional e bloco de reflexão, 9 páginas de citações/pensamentos e 1 página institucional final). | Must | O documento A5 compilado para `diario-pessoal` possui exatamente 160 páginas não datadas e apresenta as 6 prévias da modalidade. | 🟢 |
| RF-05 | O motor de diagramação deve gerar o miolo A5 do **Livro de Memórias** com exatamente 120 páginas, posicionando todas as 52 aberturas duplas de acontecimentos entre as páginas 6 e 109 de modo que toda página de fotografia/data/local ocupe uma página par `(6, 8, ..., 108)` à esquerda e toda página de relato correspondente ocupe a página ímpar seguinte `(7, 9, ..., 109)` à direita. | Must | Teste automatizado confirma 120 páginas totais e verifica a paridade par/ímpar de todas as 52 aberturas duplas `(2k, 2k+1)` de `6..109`. | 🟢 |
| RF-06 | O sistema deve gerar 6 prévias PNG reais em alta nitidez para o modelo selecionado, armazenar um rascunho temporário com token único e permitir confirmar a solicitação de orçamento gerando link para o WhatsApp do estúdio e página pública de referência `/caderno/orcamento/[id]`. | Must | Após gerar prévias e clicar em solicitar orçamento, o pedido é salvo no banco local com suas 6 prévias PNG e a referência pública responde com HTTP 200. | 🟢 |
| RF-07 | O painel administrativo deve incluir a seção `/admin/cadernos` e a página de detalhes `/admin/cadernos/[id]`, permitindo listar solicitações, inspecionar configurações e prévias salvas, baixar ativos e regenerar o documento completo de produção. | Must | O cabeçalho de `/admin` exibe o atalho para `/admin/cadernos` e a página `/admin/cadernos/[id]` exibe todos os metadados e prévias do pedido. | 🟢 |
| RF-08 | O endpoint administrativo `/admin/cadernos/[id]/pdf` deve integrar-se ao módulo de imposição A4 Cut & Stack, fornecendo o PDF A5 original (`140`, `160` ou `120` páginas) e os PDFs A4 de Frentes e Versos (`35`, `40` ou `30` folhas A4 paisagem sem folhas residuais em branco), além do acesso à Folha de Calibração A4. | Must | Os downloads de `modo=a5`, `modo=a4-frentes` e `modo=a4-versos` retornam PDFs válidos com `35`, `40` e `30` folhas A4 para os respectivos modelos. | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | A geração das 6 prévias PNG do caderno deve compilar apenas as páginas de amostra de cada seção (sem compilar as 120–160 páginas inteiras durante a prévia interativa) e utilizar semáforo de concorrência para proteger a memória do servidor. | Mesmo padrão adotado no personalizador de Planners (`_reversa_sdd/addenda/002-personalizador-planners.md`). | 🟢 |
| Segurança | As rotas `/api/caderno/preview` e `/api/caderno/quote` devem validar origem (`Origin` / `Sec-Fetch-Site`), limitar tamanho de upload a 2 MB / 4 MP, rejeitar cores com contraste inferior a `3:1` e proteger `/admin/cadernos*` com autenticação administrativa. | Regras `RN-AGE-02` e políticas de segurança documentadas em `_reversa_sdd/permissions.md`. | 🟢 |
| Compatibilidade e Portabilidade | Os templates e fontes dos Cadernos devem ser empacotados na imagem de container de produção para execução determinística sem rede externa em arquiteturas `linux/amd64` e `linux/arm64`. | Requisito operacional do ambiente de produção (`_reversa_sdd/architecture.md`). | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Personalização e orçamento de um Caderno de Receitas com 140 páginas
  Dado que o cliente acessa "/personalizar/caderno" a partir do card "Cadernos Personalizados"
  Quando seleciona o modelo "Caderno de Receitas", estilo "Clássico", tipografia "Editorial", informa o título "Receitas da Família" e gera as prévias
  Então o sistema retorna 6 prévias PNG reais (abertura, equivalências, índice, ficha de receita, anotações e página institucional) e um token de rascunho válido
  E ao confirmar a solicitação de orçamento, o pedido é persistido com status "requested", página pública "/caderno/orcamento/<id>" e link de WhatsApp preenchido

Cenário: Garantia de paridade das 52 aberturas duplas no Livro de Memórias (120 páginas)
  Dado um pedido do modelo "Livro de Memórias"
  Quando o documento A5 completo de produção é compilado
  Então o PDF resultante possui exatamente 120 páginas A5
  E as páginas 1, 2, 3, 4 e 5 contêm respectivamente Apresentação, Dedicatória, Guia Afetivo e o Sumário em abertura dupla (páginas 4 e 5)
  E todas as 52 aberturas de acontecimentos ocupam pares consecutivos (página par 2k à esquerda com fotografia/data/local, página ímpar 2k+1 à direita com relato), iniciando nas páginas 6 e 7 e terminando nas páginas 108 e 109
  E as páginas 110 a 119 contêm Recordações Especiais e a página 120 contém a Página Institucional do 678 Estudio

Cenário: Geração do Diário Pessoal não datado (160 páginas) e imposição A4 Cut & Stack na administração
  Dado um pedido salvo de "Diário Pessoal" localizado em "/admin/cadernos/<id>"
  Quando o operador solicita o PDF A5 original, o PDF A4 de Frentes e o PDF A4 de Versos no modo Cut & Stack com escala segura (96%)
  Então o PDF A5 original possui exatamente 160 páginas A5 não datadas
  E o PDF A4 de Frentes possui exatamente 40 páginas A4 paisagem (297 x 210 mm)
  E o PDF A4 de Versos possui exatamente 40 páginas A4 paisagem com correspondência física exata frente/verso para corte central em 148,5 mm

Cenário: Rejeição de cores sem contraste ou arquivo inválido no personalizador de cadernos (caso negativo)
  Dado que o cliente envia uma requisição para "/api/caderno/preview"
  Quando informa uma cor personalizada muito clara (contraste inferior a 3:1 no papel branco) ou uma imagem maior que 2 MB
  Então o servidor responde com status HTTP 400 ou 413 e mensagem clara de validação, sem iniciar a compilação do miolo
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02 | Must | Ativam o card comercial e entregam a interface única de personalização dos três modelos. |
| RF-03, RF-04, RF-05 | Must | Constituem os três miolos editoriais A5 com paginação exata (`140`, `160` e `120` páginas) e paridade rigorosa das aberturas duplas no Livro de Memórias. |
| RF-06, RF-07, RF-08 | Must | Garantem o fluxo completo de orçamento, persistência, administração e impressão A4 Cut & Stack. |
| RNF de desempenho, segurança e compatibilidade | Must | Indispensáveis para estabilidade do container em produção e proteção contra abuso. |

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada ainda. Rode `/reversa-clarify` quando houver `[DÚVIDA]` pendente.

## 10. Lacunas

Nenhuma lacuna ou `[DÚVIDA]` em aberto. Todas as decisões editoriais, de paginação (`140`, `160` e `120` páginas A5), de paridade das 52 aberturas duplas do Livro de Memórias (`páginas 6 a 109`) e de avaliação de espaço útil na ficha do Caderno de Receitas foram definidas.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-12 | Versão inicial gerada por `/reversa-requirements` com ajustes de paridade do Livro de Memórias e avaliação de layout do Caderno de Receitas | reversa |


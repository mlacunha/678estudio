# Requirements: Evolução Editorial das Agendas e Módulo Compartilhado de Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Esta entrega aperfeiçoa a composição editorial das Agendas personalizadas em formato A5 (148,5 mm × 210 mm) e disponibiliza um módulo compartilhado de preparação para impressão manual em folhas A4 (297 mm × 210 mm) para Agendas e Planners. Para o cliente final, a Agenda passa a organizar cada mês com planejamento próprio na abertura e controle financeiro dedicado no encerramento, além de incluir cadastro de contatos, calendário real do ano seguinte e página institucional final da marca. Para o operador de produção, a área administrativa passa a gerar arquivos separados de frentes A4, versos A4 e folha de calibração física para corte central reto em duas folhas A5 independentes.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/architecture.md#1. Visão Executiva e Estilo Arquitetural` | O sistema opera em monolito modular com persistência relacional local e motor dedicado de diagramação gráfica para geração atômica de documentos paginados e prévias de imagem. | 🟢 |
| `_reversa_sdd/domain.md#1. Glossário de Domínio` | A Agenda Clássica é o produto de papelaria diagramado com três opções de layout temporal (um dia por página, dois dias por página e semanal) e três estilos visuais (Clássico, Comercial e Feminino). | 🟢 |
| `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)` | As regras RN-AGE-01, RN-AGE-02 e RN-AGE-03 definem validação temporal de anos válidos (1900 a 9998), contraste mínimo de 3:1 para cores personalizadas e retenção de 8 prévias por solicitação. | 🟢 |
| `_reversa_sdd/domain.md#2.5 Configurações do Estúdio` | As regras RN-CFG-01 e RN-CFG-02 determinam registro único de configurações institucionais do estúdio com canais validados de contato e redes sociais. | 🟢 |
| `_reversa_sdd/code-analysis.md#2.5 Módulo agenda-compiler` | O compilador de agendas gera documentos paginados em PDF (Portable Document Format) e seleciona 8 páginas representativas em PNG (Portable Network Graphics) para visualização prévia. | 🟢 |
| `_reversa_sdd/code-analysis.md#2.6 Módulo admin` | O painel administrativo centraliza a consulta de solicitações de agendas e a operação de produção sem exigir reconstrução da aplicação. | 🟢 |
| `_reversa_sdd/addenda/002-personalizador-planners.md#Resumo da entrega` | A vitrine de Papelaria Personalizada mantém estritamente três famílias comerciais (Agendas, Planners e Cadernos Personalizados) e o painel administrativo já opera solicitações independentes de Agendas e Planners em formato A5. | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Cliente de Papelaria Personalizada | Adquirir uma Agenda anual completa para organizar compromissos diários ou semanais, finanças mensais e contatos em formato A5. | O cliente personaliza o layout, estilo e cores da Agenda, visualiza as 8 prévias atualizadas do miolo e envia a solicitação de orçamento. |
| Operador de Produção Gráfica | Produzir fisicamente o miolo A5 de Agendas e Planners em impressora A4 comum com alimentação manual frente e verso e corte central em guilhotina. | O operador acessa o pedido no painel administrativo, imprime a folha de calibração A4, baixa os arquivos A4 de frentes e de versos com empilhamento rápido e corta a pilha ao meio para encadernar. |

## 4. Regras de negócio novas ou alteradas

1. **RN-01 (Preservação Comercial das Três Famílias de Papelaria):** A seção de Papelaria Personalizada na vitrine pública deve manter exatamente três famílias de produtos (Agendas, Planners e Cadernos Personalizados), sendo vedada a criação de cartões adicionais para variações de layout ou estilo. 🟢
   - Origem no legado: `_reversa_sdd/addenda/002-personalizador-planners.md#Resumo da entrega`
   - Tipo: alterada (reforçada como invariante compartilhado)
2. **RN-02 (Ciclo Editorial Mensal Completo da Agenda):** Cada um dos 12 meses do ano (janeiro a dezembro) nos três layouts de Agenda (`daily-1dpp`, `daily-2dpp` e `weekly`) deve iniciar com sua respectiva página de Planejamento Mensal, seguida pelas páginas de compromissos do mês e encerrada obrigatoriamente por uma página de Controle Financeiro Mensal daquele mês. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)`
   - Tipo: alterada
3. **RN-03 (Isolamento Mensal no Layout de Dois Dias por Página):** No layout de dois dias por página (`daily-2dpp`), dias pertencentes a meses distintos nunca devem compartilhar a mesma página A5; quando um mês possuir quantidade ímpar de dias (29 ou 31 dias), a metade direita da última página diária daquele mês deve apresentar um bloco estruturado de Notas e Pendências do Mês antes da página de Controle Financeiro Mensal. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)`
   - Tipo: nova
4. **RN-04 (Atribuição Única de Semanas entre Meses no Layout Semanal):** No layout semanal (`weekly`), cada semana do ano (de segunda-feira a domingo) deve aparecer uma única vez no miolo; semanas que atravessam a transição entre dois meses são atribuídas de forma determinística ao mês da sua primeira data válida dentro do ano da Agenda, posicionando o Controle Financeiro Mensal imediatamente após a última semana atribuída àquele mês. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)`
   - Tipo: nova
5. **RN-05 (Estrutura Obrigatória do Controle Financeiro Mensal da Agenda):** Cada uma das 12 páginas de Controle Financeiro Mensal da Agenda deve conter campos pautados para Contas e Vencimentos com Controle de Pagamento, tabela de Receitas (entradas) e Despesas (saídas) com espaço para lançamentos adicionais, e quadro de fechamento com Total de Entradas, Total de Saídas e Saldo do Mês. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)`
   - Tipo: alterada
6. **RN-06 (Seções Finais de Contatos, Calendário Seguinte e Página Institucional):** Após o encerramento de dezembro, toda Agenda deve conter 4 páginas de Cadastro de Contatos com 9 registros por página (36 contatos no total, contendo Nome, Telefone, E-mail e Observações), páginas de Anotações pautadas para fechamento em número par de páginas A5, 1 página com o Calendário Anual real do ano seguinte (`ano + 1`, respeitando anos bissextos e correspondência exata de dias da semana) e 1 página final institucional identificando a produção pelo estúdio com dados reais configurados no sistema. 🟢
   - Origem no legado: `_reversa_sdd/domain.md#2.5 Configurações do Estúdio`
   - Tipo: nova
7. **RN-07 (Processo Físico Definitivo de Imposição A4 por Corte Central):** A preparação para impressão A4 de Agendas e Planners deve posicionar duas páginas A5 verticais lado a lado em cada folha A4 em orientação paisagem (297 mm × 210 mm) para corte reto central (em 148,5 mm), produzindo folhas A5 independentes; é expressamente proibido aplicar imposição de livretos ou cadernos dobrados. 🟢
   - Origem no legado: `_reversa_sdd/addenda/002-personalizador-planners.md#Resumo da entrega`
   - Tipo: nova
8. **RN-08 (Padrão Cut & Stack e Correspondência Frente/Verso Manual):** No modo padrão de produção (Cortar e Empilhar / Cut & Stack), para um documento de $L$ folhas A5 distribuídas em $S = \lceil L / 2 \rceil$ folhas A4, a folha A4 de índice $s \in \{1 \dots S\}$ deve conter na metade esquerda a folha A5 de índice $s$ (frente na página $2s-1$ e verso na página $2s$) e na metade direita a folha A5 de índice $s + S$ (frente na página $2(s+S)-1$ e verso na página $2(s+S)$), garantindo que após o corte central a pilha da esquerda colocada sobre a pilha da direita forme a sequência contínua de páginas $1$ até $N$ sem intercalação manual. 🟢
   - Origem no legado: n/a
   - Tipo: nova
9. **RN-09 (Preservação Vetorial e Margem Segura de Impressoras A4 Comuns):** A geração dos arquivos A4 de frentes e versos deve preservar integralmente a qualidade vetorial do PDF A5 original e oferecer opção de escala real (100%) ou ajuste de margem de segurança para área imprimível de impressoras A4 domésticas e semi-profissionais (compensando margens físicas não imprimíveis de até 5 mm sem amputar cabeçalhos, rodapés ou linhas de preenchimento). 🟢
   - Origem no legado: n/a
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve organizar o miolo das Agendas nos três layouts (`daily-1dpp`, `daily-2dpp` e `weekly`) em 12 ciclos mensais, iniciando cada mês com 1 página de Planejamento Mensal e encerrando cada mês com 1 página de Controle Financeiro Mensal. | Must | Compilar agendas para os 3 layouts em anos comuns (2027) e bissextos (2028) e verificar a existência de 12 aberturas mensais e 12 controles financeiros mensais posicionados ao final de cada mês. | 🟢 |
| RF-02 | O sistema deve estruturar cada página de Controle Financeiro Mensal da Agenda com tabela de Contas e Vencimentos (8 linhas com indicador de pagamento), tabela de lançamentos de Receitas e Despesas (14 linhas pautadas) e painel de fechamento com Total de Entradas, Total de Saídas e Saldo do Mês. | Must | A página de Controle Financeiro Mensal compilada ocupa 1 página A5 útil sem transbordo de página e exibe todos os rótulos obrigatórios. | 🟢 |
| RF-03 | O sistema deve isolar os dias de cada mês no layout `daily-2dpp`, preenchendo a metade direita da última página de meses com 29 ou 31 dias com um bloco intitulado "Notas e Pendências do Mês". | Must | Em qualquer ano (2027 ou 2028), nenhuma página do layout `daily-2dpp` combina o dia 31 (ou 29 de fevereiro) com o dia 1 do mês seguinte. | 🟢 |
| RF-04 | O sistema deve atribuir cada semana do layout `weekly` a um único mês (pelo mês do primeiro dia da semana pertencente ao ano da Agenda), inserindo o Controle Financeiro Mensal imediatamente após a última semana atribuída a cada mês. | Must | O PDF do layout `weekly` contém todas as semanas do ano sem duplicação e 12 páginas de Controle Financeiro Mensal intercaladas após o término das semanas de cada mês. | 🟢 |
| RF-05 | O sistema deve incluir na parte final da Agenda uma seção de Cadastro de Contatos com 4 páginas e 9 registros estruturados por página (total de 36 registros com Nome, Telefone, E-mail e Observações). | Must | As 4 páginas de Contatos são geradas após o Controle Financeiro de dezembro com 9 blocos por página. | 🟢 |
| RF-06 | O sistema deve incluir ao final do miolo da Agenda uma página de Calendário Anual real para o ano subsequente (`ano + 1`), calculando todos os 12 meses e anos bissextos com exatidão. | Must | Uma Agenda de 2027 exibe o calendário anual de 2028 com 29 dias em fevereiro; uma Agenda de 2028 exibe o calendário anual de 2029 com 28 dias em fevereiro. | 🟢 |
| RF-07 | O sistema deve incluir como última página da Agenda uma Página Institucional identificando a produção pelo estúdio, exibindo a marca gráfica oficial, o nome da marca e os canais reais configurados no sistema, omitindo campos não preenchidos. | Must | A última página do PDF A5 exibe a identificação oficial do estúdio e nunca exibe textos fictícios quando campos opcionais de contato estiverem em branco. | 🟢 |
| RF-08 | O sistema deve atualizar o mapeamento das 8 páginas de prévia da Agenda para refletir os novos índices de páginas (Abertura, Calendário Anual, Dados Pessoais, Planejamento Mensal, Layout de Compromissos, Controle Financeiro Mensal, Contatos e Calendário do Ano Seguinte / Anotações). | Must | O endpoint de prévia da Agenda retorna 8 imagens PNG correspondentes às seções reais da nova paginação nos 3 layouts. | 🟢 |
| RF-09 | O sistema deve fornecer um módulo compartilhado de imposição A4 que receba qualquer PDF A5 (de Agenda ou de Planner) e gere separadamente o arquivo PDF A4 de Frentes e o arquivo PDF A4 de Versos com duas páginas A5 lado a lado por folha A4 paisagem. | Must | Dado um PDF A5 de $N$ páginas, os PDFs A4 de Frentes e de Versos possuem $\lceil \lceil N/2 \rceil / 2 \rceil$ páginas em dimensão A4 paisagem (297 mm × 210 mm) com conteúdo 100% vetorial. | 🟢 |
| RF-10 | O módulo de imposição A4 deve suportar parametrização para modo de empilhamento (`cut-stack` padrão ou `sequencial`), orientação de virada do verso (`short-edge` trocando colunas esquerda/direita sem rotação, ou `long-edge` mantendo colunas com rotação de 180°), ordem das folhas do verso (`normal` de $1 \to S$ ou `invertida` de $S \to 1$) e margem de segurança para impressoras comuns (`100%` ou escala segura de `96%` centralizada em cada metade A5). | Must | Testes unitários validam a posição exata $(x, y)$, rotação e índice de página A5 em cada metade de cada folha A4 para todas as combinações de parâmetros. | 🟢 |
| RF-11 | O sistema deve gerar uma Folha de Calibração A4 de 2 páginas (Frente de Teste e Verso de Teste) com numeração destacada (Páginas 1, 2, 3 e 4), setas de orientação de topo, indicação de lado esquerdo/direito, linha central de corte em 148,5 mm e instruções de recolocação na bandeja. | Must | O operador consegue baixar o PDF de calibração A4 de 2 páginas diretamente no painel administrativo. | 🟢 |
| RF-12 | O painel administrativo de detalhes de Agendas e de Planners deve manter o botão de download do PDF A5 original e exibir o painel compartilhado de preparação para impressão A4 com seletores de parâmetros e botões para baixar PDF A4 — Frentes, PDF A4 — Versos e Folha de Calibração A4. | Must | Nas telas administrativas de Agendas e Planners, os controles permitem baixar tanto o PDF A5 original quanto os 3 arquivos A4 de produção. | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | A imposição vetorial de um PDF A5 completo (até 400 páginas) para os PDFs A4 de Frentes ou Versos deve concluir em menos de 5 segundos em memória, sem gravar arquivos temporários desnecessários em disco. | `_reversa_sdd/architecture.md#2.2 Integrações Externas` (geração síncrona por resposta HTTP). | 🟢 |
| Compatibilidade | O módulo de imposição A4 não deve depender de binários nativos específicos de arquitetura, funcionando identicamente em ambientes Windows e contêineres Linux nas arquiteturas AMD64 e ARM64. | `_reversa_sdd/architecture.md#1. Visão Executiva e Estilo Arquitetural` (portabilidade multi-arquitetura). | 🟢 |
| Segurança | Os parâmetros de configuração de impressão A4 recebidos via URL devem ser estritamente validados contra listas fechadas de valores permitidos, retornando código HTTP 400 para entradas inválidas. | `_reversa_sdd/code-analysis.md#2.5 Módulo agenda-compiler` (validação rigorosa de entradas). | 🟢 |
| Qualidade Gráfica | Nenhuma página do PDF A5 original pode ser convertida em imagem bitmap durante a imposição A4; fontes, linhas e vetores devem permanecer escaláveis sem perda de nitidez. | Requisito de produção editorial para impressão gráfica em papel A4/A5. | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Compilação da Agenda com ciclos mensais e seções finais completas
  Dado que o cliente ou operador solicita uma Agenda para o ano 2027 ou 2028 em qualquer layout ("daily-1dpp", "daily-2dpp" ou "weekly")
  Quando o motor gráfico compila o documento PDF A5
  Então cada um dos 12 meses inicia com sua página de Planejamento Mensal e termina com sua página de Controle Financeiro Mensal
  E o final do documento contém 4 páginas de Contatos (36 registros), páginas de Anotações, o Calendário Anual real do ano seguinte e a Página Institucional do estúdio na última página
  E o número total de páginas A5 geradas é par

Cenário: Isolamento de meses ímpares no layout de dois dias por página
  Dado que a Agenda é gerada no layout "daily-2dpp" para um mês de 31 dias (como janeiro) ou 29 dias (fevereiro bissexto)
  Quando a última página diária daquele mês é diagramada
  Então o lado esquerdo exibe o último dia do mês e o lado direito exibe o bloco "Notas e Pendências do Mês"
  E o dia 1 do mês seguinte inicia em uma nova página após o Controle Financeiro Mensal

Cenário: Geração de arquivos A4 de Frentes e Versos no modo Cut & Stack
  Dado um PDF A5 válido com N páginas (sendo L = ceil(N/2) folhas A5 e S = ceil(L/2) folhas A4)
  Quando o operador solicita o PDF A4 de Frentes e o PDF A4 de Versos no modo "cut-stack"
  Então o arquivo de Frentes contém S páginas A4 paisagem com as frentes das folhas A5 s (esquerda) e s+S (direita)
  E o arquivo de Versos contém S páginas A4 paisagem com os versos correspondentes posicionados conforme a orientação de virada selecionada
  E a simulação de corte central em 148,5 mm seguida do empilhamento da pilha esquerda sobre a pilha direita produz a sequência exata de páginas 1 até N

Cenário: Rejeição de parâmetros inválidos de imposição A4
  Dado um pedido existente de Agenda ou Planner no painel administrativo
  Quando uma requisição de download A4 informa um modo de virada ou escala fora dos valores permitidos
  Então o servidor responde com status HTTP 400 e mensagem clara de validação
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02, RF-03, RF-04 | Must | Nucleares para a completude editorial mensal das Agendas nos três layouts. |
| RF-05, RF-06, RF-07, RF-08 | Must | Indispensáveis para entregar Contatos, Calendário do ano seguinte, Página Institucional e prévias reais consistentes. |
| RF-09, RF-10, RF-11, RF-12 | Must | Essenciais para viabilizar a produção física em impressora A4 comum com corte central para Agendas e Planners. |
| RNF de Qualidade Gráfica e Compatibilidade | Must | Garantem impressão vetorial nítida e funcionamento nos contêineres AMD64 e ARM64. |
| RNF de Desempenho e Segurança | Should | Asseguram resposta fluida ao operador e proteção das rotas administrativas. |

## 9. Esclarecimentos

> Decisões de desenho já homologadas pelo usuário na abertura da especificação:
> 1. Cada Planejamento Mensal posicionado na abertura do respectivo mês.
> 2. No layout de dois dias por página, dias de meses diferentes nunca dividem página; o espaço restante recebe "Notas e Pendências do Mês".
> 3. Quatro páginas de contatos com seis registros por página (24 registros).
> 4. Estratégia Cut & Stack como padrão de imposição A4 para corte central em folhas A5 independentes, com margem de segurança opcional para área imprimível de impressoras A4 comuns.

## 10. Lacunas

Nenhuma lacuna ou `[DÚVIDA]` pendente. Todos os pontos de escopo, regras editoriais e mecânica física de impressão A4 foram esclarecidos e aprovados.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-11 | Versão inicial gerada por `/reversa-requirements` com decisões homologadas | reversa |


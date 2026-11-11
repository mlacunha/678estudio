# Requirements: Personalizador de Planners (Planner Essencial)

> Identificador: `002-personalizador-planners`  
> Data: `2026-11-11`  
> Pasta da extração reversa: `_reversa_sdd/`  
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Implementação da família **Planners** na categoria Papelaria Personalizada do 678 Estudio, preservando rigorosamente a organização de exatamente três famílias no catálogo (Agendas, Planners e Cadernos Personalizados). O card Planners é ativado e direciona para `/personalizar/planner`, oferecendo o modelo **Planner Essencial** em modalidades datada e não datada, com três estilos visuais (Clássico, Comercial e Feminino). A solução contempla um motor Typst próprio gerando miolo A5 com margens espelhadas e calha de encadernação, planejamento semanal em duas páginas A5 verticais consecutivas (abertura de 2 páginas), controle financeiro completo e prático, habit tracker, galeria com 8 prévias reais compiladas pelo Typst, persistência SQLite de pedidos e solicitação de orçamento via WhatsApp com regeneração fiel e determinística no painel administrativo.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|---|---|:---:|
| `_reversa_sdd/architecture.md#agenda-compiler` | Motor Typst embarcado compilando PDFs de alta resolução em A5 com suporte a seções e prévias | 🟢 |
| `_reversa_sdd/domain.md#papelaria-personalizada` | Três famílias da categoria: Agendas, Planners e Cadernos Personalizados. O card Planners aponta para `/personalizar/planner` | 🟢 |
| `_reversa_sdd/data-dictionary.md#agenda_quotes` | Estrutura relacional para persistência de pedidos de miolos gerados, status, referências e logos enviadas | 🟢 |
| `_reversa_sdd/addenda/001-zoom-mockup-quadros.md` | Padrões consolidados de acessibilidade e desacoplamento na visualização de prévias | 🟢 |
| `src/data/stationery.ts` | Configuração de famílias de papelaria: `'family-planners': { route: '/personalizar/planner', available: false, models: [] }` | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---|---|---|
| **Cliente Profissional / Empreendedor** | Organizar compromissos, rotinas de trabalho e finanças pessoais | Seleciona o estilo Comercial ou Clássico, modalidade datada, personaliza o miolo com sua logo corporativa e solicita orçamento para tiragem via WhatsApp |
| **Cliente de Organização Pessoal** | Acompanhar hábitos, metas mensais e planejamento semanal | Escolhe o estilo Feminino ou Clássico, avalia prévias de controle de hábitos e finanças e gera o pedido personalizado |
| **Administrador do Estúdio** | Visualizar pedidos de planners recebidos e baixar o PDF A5 de alta definição para impressão gráfica | Acessa a rota administrativa, examina a composição do cliente e aciona o compilador Typst para gerar o miolo final pronto para encadernação |

## 4. Regras de negócio novas ou alteradas

1. **RN-PLANNER-01 (Organização Comercial - Família Planners)** 🟢  
   - A categoria Papelaria Personalizada mantém exatamente três famílias de produtos: Agendas, Planners e Cadernos Personalizados.
   - O card da vitrine permanece com o título **Planners** e passa para o estado ativo (`available: true`), direcionando para `/personalizar/planner`.
   - O modelo inicial é o **Planner Essencial**, tratado como modelo interno da família Planners, sem nunca criar um card independente na vitrine.
   - Tipo: nova regra comercial.

2. **RN-PLANNER-02 (Modalidades Datada e Não Datada)** 🟢  
   - **Datado**: Permite escolher o ano (ano corrente e subsequente). Gera calendários reais com semanas calculadas com precisão astronômica/civil, suporte estrito a anos bissextos e transições contínuas de meses sem duplicação ou omissão de dias.
   - **Não datado**: Estrutura atemporal com campos guiados para preenchimento manual dos meses e dias pelo usuário.
   - Tipo: nova.

3. **RN-PLANNER-03 (Planejamento Semanal em Abertura de Duas Páginas A5)** 🟢  
   - Cada semana é diagramada em exatamente duas páginas A5 verticais consecutivas, formando uma abertura completa quando o miolo estiver encadernado (página esquerda: início da semana e prioridades; página direita: restante da semana, tarefas, hábitos semanais e notas).
   - Margens espelhadas com calha (gutter) adequada para wire-o ou costura artesanal. Proibida a geração em página única A4 horizontal.
   - Tipo: nova.

4. **RN-PLANNER-04 (Controle Financeiro Completo)** 🟢  
   - Seção financeira funcional e prática composta por: receitas previstas/realizadas, despesas fixas, despesas variáveis, contas a pagar, controle de contas pagas (com checkbox/data), metas financeiras do mês e resumo/balanço mensal.
   - Espaçamento tipográfico e linhas com altura ergonômica para preenchimento manual impresso.
   - Tipo: nova.

5. **RN-PLANNER-05 (Demais Seções Funcionais Obrigatórias)** 🟢  
   O template Typst do Planner Essencial deve gerar exatamente as 8 seções estruturadas:
   1. Abertura e identificação pessoal/período.
   2. Planejamento anual (visão geral, objetivos e projetos).
   3. Planejamento mensal (calendário, prioridades, compromissos).
   4. Planejamento semanal (abertura em 2 páginas A5).
   5. Controle de hábitos (tracker mensal integrado).
   6. Controle financeiro (tabelas práticas e resumo).
   7. Revisão mensal (resultados, conquistas, aprendizados e ajustes).
   8. Páginas de anotações livres distribuídas de forma ergonômica.
   - Tipo: nova.

6. **RN-PLANNER-06 (Estilos Visuais)** 🟢  
   - Disponibilizar três estilos: **Clássico** (minimalista, serif/sans equilibrado), **Comercial** (sóbrio, geométrico, alta densidade) e **Feminino** (linhas orgânicas, paleta suave, toques elegantes).
   - O estilo altera diagramação, paleta de cores e tipografia sem subtrair áreas funcionais.
   - Tipo: nova.

7. **RN-PLANNER-07 (Prévias Reais Typst e PDF Completo)** 🟢  
   - O personalizador deve exibir páginas reais renderizadas pelo Typst em SVG/PNG para cada uma das 8 seções funcionais, com navegação fluida e ampliação (zoom).
   - As 8 prévias correspondem fielmente às páginas reais compiladas pelo mesmo template do PDF final.
   - Tipo: nova.

8. **RN-PLANNER-08 (Persistência Padronizada e Regeneração Fiel)** 🟢  
   - Reutilização do padrão relacional consolidado de `agenda_quotes` através das tabelas `planner_quotes` e `planner_quote_assets`.
   - Persistência com `config_json` completo e validado, versão do template Typst (`config_version`), armazenamento de logo e prévias em BLOB, e regeneração determinística no painel `/admin/planners/[id]`.
   - Compatibilidade total com backup e restauração (`studio678.db`).
   - Tipo: nova.

9. **RN-PLANNER-09 (Modernização Tipográfica Independente & Fontes OFL Embarcadas)** 🟢  
   - A tipografia é tratada como dimensão independente do estilo visual (Clássico, Comercial, Feminino), disponibilizando três famílias oficiais:
     - **Moderna**: Inter (equilíbrio limpo e contemporâneo).
     - **Geométrica**: Manrope (rigor geométrico e alta legibilidade).
     - **Editorial**: DM Serif Display para títulos e DM Sans para subtítulos, corpo e tabelas financeiras/hábitos.
   - Os arquivos de fonte oficiais com licença SIL OFL são embarcados no projeto (`src/server/planner/typst/fonts/`), permitindo compilação offline idêntica e garantindo total independência do sistema operacional hospedeiro e contêineres Docker (AMD64 e ARM64).
   - Zero tolerância para fontes genéricas de fallback (ex.: Libertinus Serif).
   - Tipo: nova regra.

## 5. Requisitos Funcionais (RF)

- **RF-01:** Rota `/personalizar/planner` com formulário responsivo (modelo, modalidade, ano, estilo, cor, identificação e logo).
- **RF-02:** Galeria interativa de prévias reais renderizadas via Typst cobrindo as 8 seções funcionais do Planner.
- **RF-03:** Engine Typst modular (`src/server/planner/typst/essencial.typ`) com suporte a cálculo automático de calendários datados e grids atemporais não datados.
- **RF-04:** Seção de controle financeiro prático em tabela de alta legibilidade para preenchimento manual impresso.
- **RF-05:** Seção de habit tracker mensal com células para marcação de frequência.
- **RF-06:** Geração do PDF final de produção em formato A5 com paginação automática, margens internas (gutter) para encadernação e zero páginas em branco espúrias.
- **RF-07:** Endpoint `/api/planner/preview` para compilação sob demanda das páginas de amostra.
- **RF-08:** Endpoint `/api/planner/quote` para persistência do pedido, upload de logo e geração de mensagem estruturada para WhatsApp.
- **RF-09:** Painel administrativo `/admin/planners/[id]` para auditoria do pedido e download do miolo completo em PDF.
- **RF-10:** Ativação da família Planners em `src/data/stationery.ts`.
- **RF-11:** Seleção independente de tipografia no personalizador (`/personalizar/planner`), persistência da escolha na cotação e regeneração administrativa com fontes empacotadas localmente via `--font-path`.

## 6. Requisitos Não Funcionais (RNF)

- **RNF-01 (Compatibilidade Não-Destrutiva):** Preservar 100% dos personalizadores de canecas, quadros e agendas clássicas (`agenda-classica-v1` e `v2`), sem modificar schemas históricos de forma destrutiva.
- **RNF-02 (Performance de Compilação):** As prévias Typst devem compilar páginas individuais em menos de 800ms por requisição.
- **RNF-03 (Imutabilidade de Produção):** O PDF de produção gerado a partir de um pedido salvo deve ser 100% determinístico.
- **RNF-04 (Acessibilidade e Design System):** Suporte estrito a tema claro e escuro, labels de acessibilidade para formulários e controles táteis em dispositivos móveis.

## 7. Decisões Técnicas Principais

| ID | Decisão | Justificativa | Alternativas Descartadas | Confidência |
|---|---|---|---|:---:|
| D-01 | Reutilização do motor Typst embarcado do projeto | O Typst já está instalado no contêiner e configurado em `src/server/agenda/typst/`, com alto desempenho de compilação PDF/SVG. | Geradores baseados em Puppeteer/Chromium ou Weasyprint (descartados por lentidão e consumo excessivo de memória). | 🟢 |
| D-02 | Template Typst próprio (`src/server/planner/typst/essencial.typ`) | O Planner possui estrutura conceitual, seções e densidade completamente distintas de uma agenda diária. | Adaptar o template da agenda clássica com flags (descartado para evitar acoplamento espaguete). | 🟢 |
| D-03 | Estrutura relacional padronizada `planner_quotes` e `planner_quote_assets` | Alinha-se exatamente ao padrão robusto de `agenda_quotes`, usando JSON validado, versionamento e BLOBs de assets. | Misturar colunas na tabela de agendas ou salvar em JSON avulso sem integridade referencial. | 🟢 |
| D-04 | Módulo matemático de datas para o Planner | Funções puras em TypeScript/JavaScript para gerar matriz de semanas de cada ano, isolando a lógica de calendários para testes unitários com Vitest. | Dependências pesadas como Moment.js (descartado). | 🟢 |

## 8. Marcadores `[DÚVIDA]`

- **Total de dúvidas:** **0** (todos os ajustes foram incorporados e delimitados com precisão técnica).

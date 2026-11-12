# Requirements: Sistema Compartilhado de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Implementar um subsistema modular e compartilhado de personalização e geração de capas para as três famílias de Papelaria Personalizada do **678 Estudio** (Agendas, Planners e Cadernos). O sistema permite ao cliente compor capas frontais e contracapas profissionais através de abas no formulário ("1. Capa e Contracapa" e "2. Miolo e Conteúdo") com três estilos editoriais pré-definidos (Clássica, Moderna e Fotográfica), oferecendo prévias visuais ágeis (arte plana e mockup realista) e gerando PDFs de produção vetoriais em formato A5 com sangria técnica configurável (3 mm ou 5 mm), margens de segurança e compensação de furação Wire-O/espiral, além de folha combinada A4 horizontal (corte ao meio sem dobra) ajustada à área imprimível sem distorção. Tudo plenamente integrado aos orçamentos, painel administrativo e sem interferir na imposição A4 Cut & Stack dos miolos.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/architecture.md#1. Visão Executiva e Estilo Arquitetural` | Arquitetura Modular Monolith com Islands Architecture em Astro 4.16 SSR, Node.js híbrido, persistência SQLite (`@libsql/client`) e geração gráfica com subprocessos Typst CLI. | 🟢 |
| `_reversa_sdd/domain.md#2.4 Motor de Agendas (Typst)` | Regras de validação cromática por luminância WCAG 2.1 AA ($\ge 3:1$), tokens de rascunho de orçamentos e retenção de prévias e imagens em banco. | 🟢 |
| `_reversa_sdd/code-analysis.md#2.6 Módulo admin` | Painel de visualização de pedidos, recuperação de ativos enviados e acionamento de geração de arquivos de impressão. | 🟢 |
| `_reversa_sdd/addenda/004-cadernos-personalizados.md#Resumo da entrega` | Estrutura unificada de orçamentos em SQLite (`notebook_quotes`, `notebook_quote_assets`), rotas administrativas e imposição A4 Cut & Stack compartilhada. | 🟢 |
| `src/server/print/a4Imposition.ts` | Motor de imposição A4 de miolos em Cut & Stack (folhas frente e verso); o fluxo de capas deve permanecer desacoplado desta rotina. | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Cliente de Papelaria Personalizada | Escolher e personalizar a capa e contracapa da sua Agenda, Planner ou Caderno sem atrito visual ou complexidade de editores gráficos genéricos. | Acessa `/personalizar/{agenda,planner,caderno}`, utiliza as abas superiores "1. Capa e Contracapa" e "2. Miolo e Conteúdo", escolhe o estilo (Clássica, Moderna, Fotográfica), define títulos, cores ou faz upload de foto própria com enquadramento, visualizando imediatamente a prévia plana e o mockup do produto antes de enviar o orçamento via WhatsApp. |
| Operador do Estúdio / Gráfica | Recuperar a arte final aprovada e imprimir a capa frontal e contracapa em escala real com especificações gráficas exatas. | No painel administrativo `/admin/{agendas,planners,cadernos}/[id]`, visualiza as especificações da capa, baixa a fotografia original em alta resolução e escolhe no menu de geração: (a) Capa A5 avulsa com sangria (3 mm ou 5 mm), (b) Contracapa A5 avulsa com sangria, ou (c) Folha A4 horizontal combinada (Capa + Contracapa lado a lado) ajustada à área imprimível com guia de corte central ao meio (sem dobras). |

## 4. Regras de negócio novas ou alteradas

1. **RN-CAP-01 (Transversalidade entre Famílias):** O motor e os esquemas de personalização de capas devem ser compartilhados de forma transparente entre Agendas (`family-agendas`), Planners (`family-planners`) e Cadernos (`family-cadernos`). 🟢
   - Origem no legado: `src/data/stationery.ts`, `src/server/caderno/quoteConfig.ts`.
   - Tipo: nova.
2. **RN-CAP-02 (Estilos Homologados de Capa):** O sistema oferece estritamente 3 estilos conceituais:
   - **Clássica:** Composição editorial refinada, molduras discretas, tipografia clássica serifada/sans, destaque para nome e título. 🟢
   - **Moderna:** Minimalismo contemporâneo, blocos ou linhas geométricas, tipografia limpa, paleta contrastante customizável. 🟢
   - **Fotográfica:** Área predominante para fotografia/arte do cliente, máscara/enquadramento com ajuste de zoom e offset, tipografia integrada e tratamento de contraste para legibilidade. 🟢
   - Tipo: nova.
3. **RN-CAP-03 (Contracapa Correspondente Automática):** A contracapa deve ser gerada automaticamente em harmonia com a capa frontal selecionada (mesma paleta cromática, identidade tipográfica, logotipo/chancela discreta do 678 Estudio e composição limpa). 🟢
   - Tipo: nova.
4. **RN-CAP-04 (Especificações Técnicas de Produção Gráfica):**
   - **Formato Final Refilado:** A5 padrão (`148 × 210 mm`). 🟢
   - **Sangria de Impressão Configurável (Bleed):** Suporte nativo a sangria de `3 mm` ou `5 mm` além da linha de corte (dimensão bruta `154 × 216 mm` ou `158 × 220 mm`). 🟢
   - **Margem de Segurança (Live Area):** Textos, logos e elementos visuais críticos devem manter distância mínima de `8 mm` do refile externo e `15 mm` na margem de furação. 🟢
   - **Área de Furação (Wire-O / Espiral):** Compensação de margem interna segura de `12 mm a 15 mm` na borda de encadernação para garantir que a furação mecânica não atinja letras ou fotos. 🟢
   - Tipo: nova.
5. **RN-CAP-05 (Imposição A4 Horizontal com Corte ao Meio):**
   - Montagem de Capa e Contracapa lado a lado em folha A4 horizontal (`297 × 210 mm`). 🟢
   - A imposição respeita as margens não-imprimíveis da impressora e a escala 1:1 exata (sem compressão arbitrária nem presumir que duas capas com sangria cabem na A4 sem ajuste de margens). 🟢
   - A folha A4 inclui linha de corte central guia para refilar as duas metades A5 de forma independente (corte ao meio, sem dobra de lombada). 🟢
   - Tipo: nova.
6. **RN-CAP-06 (Isolamento Editorial de Miolo vs. Capa):** A geração dos PDFs de capa frontal e contracapa é independente da geração dos miolos e não utiliza a rotina de imposição A4 Cut & Stack (que é exclusiva para folhas de miolo). 🟢
   - Origem no legado: `src/server/print/a4Imposition.ts`.
   - Tipo: confirmada.
7. **RN-CAP-07 (Conformidade Cromática e Acessibilidade):** Toda combinação de cores personalizadas (fundo e tipografia) deve cumprir o índice mínimo de contraste de 3:1 (WCAG 2.1 AA para elementos visuais e textos grandes). 🟢
   - Origem no legado: `_reversa_sdd/domain.md#RN-AGE-02`.
   - Tipo: confirmada.

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Módulo de Opções e Tipos Compartilhados de Capas | Must | Criar esquemas tipados (`CoverStyle`, `CoverConfig`, `CoverTypography`, `CoverColors`, `CoverAsset`) reutilizáveis em `src/server/cover/`. | 🟢 |
| RF-02 | Três Estilos Pré-definidos de Composição | Must | Suporte aos estilos `classic`, `modern` e `photographic` aplicáveis a qualquer família de papelaria. | 🟢 |
| RF-03 | Navegação por Abas no Personalizador | Must | Implementar abas superiores integradas ("1. Capa e Contracapa" e "2. Miolo e Conteúdo") sem perda de estado ou contexto. | 🟢 |
| RF-04 | Campos de Conteúdo da Capa | Must | Suportar título, nome personalizado, subtítulo/ano opcional e fotografia do cliente. | 🟢 |
| RF-05 | Ajuste de Enquadramento e Posição da Foto | Should | Permitir ajuste de zoom (100% a 250%) e deslocamento horizontal/vertical na capa fotográfica. | 🟢 |
| RF-06 | Geração de Contracapa Harmonizada | Must | Gerar contracapa correspondente com chancela institucional e cor de fundo compatível. | 🟢 |
| RF-07 | Prévias Visuais em Tempo Real (Arte Plana e Mockup) | Must | Renderizar prévia plana da capa/contracapa e exibição de mockup realista do produto encadernado. | 🟢 |
| RF-08 | Compilação Vetorial Typst de Produção Gráfica em A5 | Must | Gerar PDFs vetoriais com sangria configurável (3 mm ou 5 mm), marcas de corte e zona de furação preservada. | 🟢 |
| RF-09 | Imposição A4 Horizontal com Corte Central | Must | Gerar PDF A4 horizontal com Capa e Contracapa lado a lado, respeitando margens imprimíveis e guia de corte central sem dobras. | 🟢 |
| RF-10 | Seleção de Formato de Saída no Painel Administrativo | Must | Disponibilizar botões de exportação no admin: (a) Capa A5 c/ sangria, (b) Contracapa A5 c/ sangria, (c) Folha combinada A4 horizontal. | 🟢 |
| RF-11 | Persistência do Pedido de Capa | Must | Armazenar a configuração de capa e seus ativos anexos no registro de orçamento correspondente (`agenda_quotes`, `planner_quotes`, `notebook_quotes`). | 🟢 |
| RF-12 | Preparação Arquitetural para Estampas do Estúdio | Should | Preparar contratos com campo de identificação de origem (`custom_upload` vs `studio_library`), deixando a biblioteca de catálogo para fase posterior. | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Geração da prévia plana da capa em menos de 1.2s no cliente. | Essencial para manter a fluidez interativa nos personalizadores sem degradar a UX. | 🟢 |
| Fidelidade Gráfica | Preservação de elementos vetoriais e resolução mínima de 300 DPI para fotos no PDF de produção Typst. | Garantir nitidez em impressões gráficas e acabamento profissional. | 🟢 |
| Arquitetura | Motor puramente baseado em Astro SSR, TypeScript, SQLite e Typst CLI local, sem microsserviços adicionais. | Alinhamento com a infraestrutura dockerizada monólita AMD64/ARM64 do 678 Estudio. | 🟢 |
| Isolamento | Nenhuma dependência cruzada com o módulo `src/server/print/a4Imposition.ts`. | A imposição de miolos A4 Cut & Stack opera sobre blocos volumosos; capas seguem acabamento independente. | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Cliente personaliza um Caderno com Capa Clássica navegando por abas
  Dado que o cliente acessa "/personalizar/caderno"
  Quando seleciona a aba "1. Capa e Contracapa", escolhe o estilo "Clássica", digita o título "Receitas da Família" e nome "Ana Clara"
  E clica na aba "2. Miolo e Conteúdo" para escolher as preferências do miolo
  Então as configurações da capa e do miolo permanecem sincronizadas
  E a prévia visual exibe tanto a arte plana quanto o mockup realista da capa

Cenário: Cliente escolhe Capa Fotográfica com foto de família
  Dado que o cliente seleciona o estilo "Fotográfica" no personalizador de Agenda
  Quando faz upload de uma imagem PNG de 1.8 MB e ajusta o enquadramento
  Então o sistema renderiza a prévia com a fotografia ajustada, texto em contraste legível e prévia da contracapa harmonizada
  E ao enviar o orçamento via WhatsApp, a foto original em alta resolução é preservada no banco

Cenário: Operador gera os arquivos de produção no painel administrativo
  Dado que o operador acessa o pedido "/admin/cadernos/[id]"
  Quando seleciona o formato de impressão
  Então pode escolher baixar a Capa A5 avulsa com sangria de 3mm/5mm, a Contracapa A5 com sangria, ou a folha combinada A4 horizontal
  E a folha A4 apresenta as duas capas posicionadas com guia de corte central para refilar ao meio sem dobra
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02, RF-03, RF-04, RF-06, RF-07, RF-08, RF-09, RF-10, RF-11 | Must | Estrutura essencial para personalização com abas, persistência, integração com os 3 produtos e geração dos PDFs de produção A5/A4. |
| RF-05, RF-12 | Should | Ajuste fino de enquadramento da foto e preparação de modelo para acervo de estampas futuro. |
| Edição por camadas livres / arrastar elementos no canvas | Won't | Fora de escopo da primeira versão para manter a simplicidade e consistência gráfica do estúdio. |
| Lombadas rígidas para encadernação colada / capa dura quadrada | Won't | Fora de escopo; foco exclusivo em cadernos/agendas encadernados em Wire-O ou espiral. |

## 9. Esclarecimentos

### Sessão 2026-11-12

- **Q: Como deve ser a experiência de navegação do cliente entre a personalização da Capa e do Miolo nos formulários?**
  **R:** Adotada navegação por abas superiores integradas ("1. Capa e Contracapa" e "2. Miolo e Conteúdo") mantendo a prévia visual sincronizada e avançando sem perder o contexto dos campos preenchidos.
- **Q: Qual o formato esperado para a geração dos arquivos PDF de produção gráfica das capas no painel administrativo?**
  **R:** O operador pode escolher o formato no painel administrativo:
  1. Arquivos individuais da Capa e da Contracapa em A5 com sangria configurável (3 mm ou 5 mm), com marcas de corte e margem de segurança.
  2. PDF A4 horizontal com Capa e Contracapa lado a lado, ajustado à área imprimível com escala real e margens de segurança adequadas (sem presumir que duas capas com sangria integral cabem em A4 sem ajuste).
  3. A folha A4 inclui guia de corte para separação ao meio, sem dobras (para encadernação em espiral ou Wire-O).
- **Q: Qual o escopo da biblioteca de estampas do estúdio para esta primeira versão da Feature 005?**
  **R:** Primeira fase focada em cores sólidas, tipografias, estilos editoriais e upload de imagem do cliente, preparando o modelo de dados com metadados para acervo de estampas em fase posterior.

## 10. Lacunas

Nenhuma dúvida ou lacuna restante. Todos os pontos técnicos e de escopo foram esclarecidos.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-12 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-11-12 | Integração dos esclarecimentos das decisões de UI (abas), formatos de impressão (A5 com sangria 3/5mm e A4 horizontal com corte ao meio) e escopo de estampas via `/reversa-clarify` | reversa |

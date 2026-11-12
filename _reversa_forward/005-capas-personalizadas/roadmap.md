# Roadmap: Sistema Compartilhado de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`
> Requirements: `_reversa_forward/005-capas-personalizadas/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Implementar a personalização compartilhada de capas para as famílias Agendas, Planners e Cadernos através de um módulo modular em `src/server/cover/`. A experiência do usuário nos três personalizadores adota abas superiores integradas ("1. Capa e Contracapa" e "2. Miolo e Conteúdo") com prévias instantâneas (arte plana e mockup realista de produto físico). O motor de produção utiliza templates dedicados Typst (`src/server/cover/typst/`) para compilar PDFs vetoriais com precisão milimétrica em escala 1:1, suportando sangrias configuráveis de 3 mm ou 5 mm em formato A5 individual, além de imposição em folha A4 horizontal com Capa e Contracapa dispostas lado a lado e guia de corte central sem dobras. O painel administrativo expõe botões dedicados de exportação e download do ativo original, sem qualquer interferência na rotina de imposição A4 Cut & Stack dos miolos.

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Reuso transversal sem duplicação | O mesmo motor de capas, templates Typst e componentes de abas atendem Agendas, Planners e Cadernos. | Respeita 🟢 |
| Precisão dimensional para produção gráfica | Suporte a sangrias físicas (3/5mm), margem de furação Wire-O de 15mm e alinhamento milimétrico sem distorção. | Respeita 🟢 |
| Simplicidade de fluxo para o cliente | 3 estilos conceituais sólidos que eliminam a sobrecarga cognitiva de editores gráficos por camadas genéricas. | Respeita 🟢 |
| Não interferência em módulos existentes | O módulo `src/server/print/a4Imposition.ts` de miolos permanece 100% intocado. | Respeita 🟢 |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | **Módulo Compartilhado `src/server/cover/`** | Centraliza contratos, compilação Typst, rotas de preview e validação cromática WCAG em um único local. | Duplicar lógica em cada módulo de produto (`agenda/`, `planner/`, `caderno/`). | 🟢 |
| D-02 | **Abas Superiores Integradas nos Personalizadores** | Permite alternar facilmente entre a Capa e o Miolo mantendo o contexto do formulário e o preview sincronizados. | Páginas separadas ou formulários excessivamente longos com rolagem exaustiva. | 🟢 |
| D-03 | **Templates Vetoriais Typst para Capas** | Qualidade vetorial perfeita, controle absoluto de margens/sangrias e execução rápida em contêiner Docker. | Renderização HTML/Puppeteer (pesada) ou imagens rasterizadas de baixa resolução. | 🟢 |
| D-04 | **Folha Combinada A4 Horizontal com Corte ao Meio** | Atende a impressoras com bandeja A4 fixa, posicionando Capa e Contracapa com guia central de refile sem dobra. | Exigir obrigatoriamente papéis A5 avulsos ou tentar encaixar sangrias integrais que ultrapassariam os 297 mm da A4. | 🟢 |
| D-05 | **Serialização JSON no Pedido Existente** | O objeto `cover` é persistido dentro do campo `config_json` dos orçamentos existentes, dispensando migrações relacionais destrutivas. | Criar tabelas adicionais e migrações que aumentam a complexidade de junção. | 🟢 |

## 4. Premissas

Nenhuma premissa arriscada pendente. Todas as dúvidas de escopo foram esclarecidas no `/reversa-clarify`.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `cover-engine` | `src/server/cover/` (novo) | componente-novo | Módulo central de capas (opções, validação de cores, compilador Typst e renderizador de mockups). |
| `cover-typst` | `src/server/cover/typst/` (novo) | componente-novo | Templates Typst `classic.typ`, `modern.typ`, `photographic.typ`, `combined_a4.typ` e entrypoint `cover.typ`. |
| `cover-api` | `src/pages/api/cover/preview.ts` (novo) | contrato-novo | Endpoint público para geração de prévias da arte e do mockup. |
| `customizer-tabs` | `src/components/customizer/CoverCustomizerTab.astro` (novo) | componente-novo | Componente reutilizável de aba de personalização de capa para inclusão em `/personalizar/*`. |
| `admin-cover-panel` | `src/pages/admin/...` | contrato-alterado | Inclusão de botões de exportação de capas nos painéis de pedidos de cadernos, agendas e planners. |
| `Dockerfile` | `Dockerfile` | componente-alterado | Cópia do diretório `src/server/cover` para o estágio runtime da imagem Docker. |

## 6. Delta no modelo de dados

- **Resumo:** Não requer novas tabelas no banco de dados SQLite. O objeto tipado `CoverConfig` é integrado ao JSON de configuração dos pedidos e os arquivos binários (foto da capa fotográfica e prévias) utilizam as tabelas existentes de assets (`notebook_quote_assets`, `agenda_quote_assets`, `planner_quote_assets`) com o tipo `cover_image`.
- **Detalhes:** Documentados em [`_reversa_forward/005-capas-personalizadas/data-delta.md`](file:///d:/Projetos/site678Estudio/_reversa_forward/005-capas-personalizadas/data-delta.md).

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `cover-endpoints` | HTTP REST | [`_reversa_forward/005-capas-personalizadas/interfaces/cover-endpoints.md`](file:///d:/Projetos/site678Estudio/_reversa_forward/005-capas-personalizadas/interfaces/cover-endpoints.md) |

## 8. Plano de migração

Não aplicável (n/a). Os pedidos já existentes sem configuração de capa continuam sendo lidos normalmente, assumindo capa padrão neutra caso abertos para visualização.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Foto enviada pelo cliente com baixa resolução | Médio | Média | O compilador Typst preserva a qualidade máxima da imagem e a interface do personalizador avisa sobre resolução recomendada ($\ge 300\text{ DPI}$). |
| Furação mecânica atingir texto ou rosto na capa | Alto | Baixa | Imposição rígida de margem de segurança de 15 mm na lateral de furação nos templates Typst e no mockup de prévia. |
| Excesso de peso do binário em contêineres Docker | Baixo | Baixa | Reaproveitamento integral do binário Typst CLI e fontes já presentes no ambiente Docker. |

## 10. Critério de pronto

- [ ] Módulo `src/server/cover/` implementado com testes automatizados.
- [ ] Templates Typst dos 3 estilos (`classic`, `modern`, `photographic`) validados com compilação vetorial.
- [ ] Geração de PDFs em A5 com sangrias de 3 mm e 5 mm, e folha combinada A4 com corte ao meio.
- [ ] Integração com abas nos personalizadores `/personalizar/caderno`, `/personalizar/agenda` e `/personalizar/planner`.
- [ ] Painel administrativo permitindo baixar a foto original e gerar os PDFs de capa.
- [ ] Suíte de testes aprovada (`pnpm test`, `test_engine.py`), Astro Check limpo e build de produção executado com sucesso.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-12 | Versão inicial gerada por `/reversa-plan` | reversa |


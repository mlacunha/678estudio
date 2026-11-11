# Análise Técnica do Código — 678 Estudio

Documento consolidado gerado na Fase de Escavação pelo Archaeologist.

---

## 1. Visão Geral da Arquitetura
A aplicação adota o framework **Astro 4.16** configurado com o adaptador `@astrojs/node` em modo híbrido (`output: 'hybrid'`). O armazenamento local persistente utiliza SQLite via `@libsql/client`, eliminando dependências nativas problemáticas em ambientes Windows/pnpm e viabilizando consultas parametrizadas com alta performance e integridade transacional.

---

## 2. Análise Detalhada dos Módulos Escavados

### 2.1 Módulo `catalog`
- **Responsabilidade**: Catálogo digital de produtos e categorias para exibição no front-end e gestão administrativa.
- **Entry Points & Rotas**:
  - `src/db/catalogRepository.ts`: Operações CRUD e consultas indexadas.
  - `GET /api/categories`: Recupera categorias ativas (ou todas se `?all=true`).
  - `GET /api/products`: Recupera produtos com suporte a filtro por slug de categoria e parâmetro `all`.
  - `POST /api/products`: Criação com sanitização e atribuição de ordenação padrão (`display_order = 99`).
  - `PUT /api/products/[id]`: Atualização parcial, troca atômica de status (`toggleActive`) e edição completa.
  - `DELETE /api/products/[id]`: Exclusão de registro.
- **Padrões Identificados**:
  - Funções de mapeamento tipadas (`mapRowToCategory`, `mapRowToProduct`).
  - Queries parametrizadas estritas (`client.execute({ sql, args })`).
  - Tratamento de idempotência no boot via chamada prévia de `initDatabase(client)`.
- **Nível de Confiança**: 🟢 CONFIRMADO.

### 2.2 Módulo `database`
- **Responsabilidade**: Abstração do SQLite local (`studio678.db`), bootstrapping de tabelas e aplicação segura de migrações estruturais.
- **Entry Points**:
  - `src/db/database.ts`
- **Lógica de Conexão e Concorrência**:
  - Padrão **Singleton** para o cliente (`dbClientInstance`).
  - Controle de corrida de inicialização via `WeakMap<Client, Promise<void>>`, assegurando que múltiplas chamadas assíncronas concorrentes de `initDatabase()` aguardem a mesma promise em execução sem duplicar DDL.
- **Migrações e Versionamento**:
  - Implementação transacional com rollback automático (`migrateStationery`).
  - Registro de histórico em `schema_migrations`.
- **Nível de Confiança**: 🟢 CONFIRMADO.

### 2.3 Módulo `customizer-caneca-3d`
- **Responsabilidade**: Personalizador 3D interativo de canecas em cerâmica branca de 325ml.
- **Entry Points**:
  - `src/pages/personalizar/caneca.astro`
  - `src/components/customizers/Mug.astro`
  - `src/utils/customizer.ts`
- **Lógica e Algoritmos**:
  - **Mapeamento UV e Geometria**: A função `getMugPrintBand(widthCm)` converte medidas reais de impressão em centímetros (20, 21 ou 22 cm) para o sistema de coordenadas do Three.js, calculando o arco cilíndrico (`thetaStart` e `thetaLength`) com raio médio de 0.97 unidades e fator de escala métrica de 0.22 unidades por cm.
  - **Posicionamento da Alça**: A alça fica no eixo $+X$ ($\pi/2$), e a folga sem estampa é centralizada geometricamente oposta ao ponto de foco visual.
  - **Exportação & WhatsApp**: A arte configurada gera um snapshot que é persistido via `/api/mockup/save`, gerando uma URL de mockup anexada ao link formatado do WhatsApp via `buildMockupWhatsAppMessage`.
- **Nível de Confiança**: 🟢 CONFIRMADO.

### 2.4 Módulo `customizer-quadro-ambiente`
- **Responsabilidade**: Simulação visual e enquadramento de quadros em madeira clara sublimada (30 × 40 cm) em cenários fotorrealistas de sala e escritório.
- **Entry Points**:
  - `src/pages/personalizar/quadro.astro`
  - `src/components/customizers/Frame.astro`
  - `src/utils/frameLayout.ts`
- **Lógica e Algoritmos**:
  - **Cálculo de Layout e Margens**: `getFrameLayout` aplica proporção fixa de 15 pixels por cm (`pixelsPerCm = 15`), calculando o chanfro de borda e margens de madeira limitadas entre 0.5 cm e 8 cm.
  - **Renderização Multicamadas**: O canvas compõe o ambiente de fundo, a projeção de sombra suave do quadro, a moldura (preta, branca ou marrom com borda e chanfro), a prancha de madeira clara e a estampa com controles de zoom (50% a 250%) e deslocamento X/Y.
- **Nível de Confiança**: 🟢 CONFIRMADO.

### 2.5 Módulo `agenda-compiler`
- **Responsabilidade**: Motor de diagramação e compilação de miolos de agendas anuais clássicas em PDF vetorial de alta fidelidade e geração de prévias PNG.
- **Entry Points**:
  - `src/server/agenda/classic.mjs`
  - `src/server/agenda/quoteConfig.ts`
  - `src/pages/api/agenda/preview.ts`
  - `src/pages/api/agenda/quote.ts`
- **Lógica e Algoritmos**:
  - **Subprocesso Typst**: Invocação via `node:child_process` do CLI `typst compile` em pasta temporária descartável isolada (`mkdtemp`). As fontes personalizadas (`fonts/`) e bibliotecas são passadas por `--font-path` e `--root`.
  - **Validação de Paleta & Acessibilidade**: `isAgendaColor` valida saturação e luminância relativa segundo o contraste WCAG mínimo de 3:1 para legibilidade.
  - **Prévias Inteligentes**: `agendaPreviewSections` calcula as 8 páginas mais representativas do ano (abertura, calendário anual, dados pessoais, planejamento mensal, layouts de miolo, controle financeiro e anotações), compilando apenas essas páginas para renderização rápida.
- **Nível de Confiança**: 🟢 CONFIRMADO.

### 2.6 Módulo `admin`
- **Responsabilidade**: Área administrativa para gestão operacional sem necessidade de rebuild da aplicação Astro.
- **Entry Points**:
  - `src/pages/admin/index.astro`: Gestão de produtos, visibilidade e contatos da empresa.
  - `src/pages/admin/agendas/index.astro`: Visualização de cotações de agendas salvas em banco.
  - `src/pages/admin/trabalhos/index.astro`: Cadastro e curadoria de fotos de portfólio de entregas reais.
  - `src/pages/admin/estudio/index.astro`: Utilitários internos de geração de mockups.
  - `src/pages/admin/backup/index.astro`: Exportação e segurança da base SQLite.
- **Padrões Identificados**:
  - Validações estritas de canais sociais (`validateStudioSettings`), garantindo hosts canônicos HTTPS (`instagram.com`, `facebook.com`) e números de telefone com DDI internacional.
- **Nível de Confiança**: 🟢 CONFIRMADO.

### 2.7 Módulo `public-site`
- **Responsabilidade**: Apresentação editorial pública, vitrine responsiva e conversão direta via WhatsApp.
- **Entry Points**:
  - `src/pages/index.astro`: Homepage com Hero, carrosséis de 4 categorias (`quadros`, `canecas`, `papelaria`, `artesanato`) e seções de proposta de valor.
  - `src/pages/trabalhos/index.astro`: Galeria de fotos de produtos já entregues.
  - `src/pages/contato/index.astro`: Informações de localização, canais e horários.
  - `src/components/CategorySection.astro`, `ProductCard.astro`: Componentes atômicos com estados interativos e botões de chamada direta para customização.
- **Nível de Confiança**: 🟢 CONFIRMADO.

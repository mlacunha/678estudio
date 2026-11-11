# Documento de Arquitetura de Software — 678 Estudio

Documento consolidado gerado na Fase de Interpretação pelo Architect.

---

## 1. Visão Executiva e Estilo Arquitetural
O **678 Estudio** adota o estilo arquitetural **Modular Monolith com Islands Architecture** suportado pelo ecossistema Astro 4.16 e Node.js em modo híbrido.
- **Frontend**: Combina páginas pré-renderizadas estaticamente para máxima performance e SEO no catálogo com *ilhas interativas hidratadas sob demanda* (Three.js WebGL para canecas e HTML5 Canvas 2D para quadros).
- **Backend / Camada de Aplicação**: Rotas de API REST leves integradas ao Astro (`src/pages/api/`), acessando repositórios tipados diretamente via TypeScript sem necessidade de frameworks pesados adicionais.
- **Persistência**: SQLite incorporado localmente (`data/studio678.db`) operado pelo driver `@libsql/client`, eliminando latência de rede em queries relacionais e simplificando backups.
- **Motor de Diagramação Gráfica**: Subprocesso dedicado operando o binário Typst CLI para compilação atômica de PDFs gráficos de agendas anuais.

---

## 2. Decisões Estruturais e Integrações

### 2.1 Conexão e Isolamento de Dados
- **Singleton Idempotente**: O acesso ao banco é centralizado em `getDbClient()` com inicialização assíncrona guardada por `WeakMap<Client, Promise<void>>`.
- **Migrações Atômicas**: Novas estruturas relacionais rodam sob transações explícitas com histórico rastreado na tabela `schema_migrations`.
- **Segurança de Consultas**: 100% das operações SQL no código utilizam consultas parametrizadas com placeholders (`?`), prevenindo injeções de SQL.

### 2.2 Integrações Externas
- **WhatsApp API / Link Schema**: O fechamento de orçamentos utiliza o protocolo de URL `https://wa.me/{numero}?text={mensagem}`, onde a mensagem carrega a prévia hospedada em `/api/mockup/save`.
- **Typst CLI Subprocess**: Comunicação bidirecional com passagem de parâmetros por argumentos de CLI (`--input key=value`) e captura de stdout/stderr via buffer binário para servir direto na resposta HTTP.

---

## 3. Dívidas Técnicas Identificadas

| Item | Gravidade | Descrição | Sugestão de Melhoria |
|---|:---:|---|---|
| **Ausência de Autenticação Centralizada** | Média 🟡 | O painel `/admin` confia em restrição de rede/reverse-proxy do contêiner. Não há middleware JWT ou sessão com hash de senha em banco. | Implementar middleware de autenticação (ex: sessão Astro com cookie seguro). |
| **Persistência de Arquivos Binários em SQLite** | Baixa 🟡 | Prévias de agendas são armazenadas como `BLOB` em `agenda_quote_assets`. | Para volumes maiores, migrar blobs para storage S3/R2 ou pasta dedicada de arquivos com retenção TTL. |
| **Dependência do Binário Typst no Host** | Baixa 🟡 | Se o binário `typst` não estiver no `$PATH`, rotas de agendas falham com erro de spawn. | Incluir validação amigável e graceful degradation informando que o motor Typst está ausente. |

---

## 4. Referência dos Diagramas de Arquitetura
- [Diagrama C4 Contexto (Nível 1)](file:///d:/Projetos/site678Estudio/_reversa_sdd/c4-context.md)
- [Diagrama C4 Contêineres (Nível 2)](file:///d:/Projetos/site678Estudio/_reversa_sdd/c4-containers.md)
- [Diagrama C4 Componentes (Nível 3)](file:///d:/Projetos/site678Estudio/_reversa_sdd/c4-components.md)
- [Diagrama ERD Completo](file:///d:/Projetos/site678Estudio/_reversa_sdd/erd-complete.md)
- [Matriz de Impacto de Especificações](file:///d:/Projetos/site678Estudio/_reversa_sdd/traceability/spec-impact-matrix.md)


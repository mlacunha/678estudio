# 678 Estudio — Plataforma Institucional, Catálogo Dinâmico & Administração

Plataforma do **678 Estudio**, estúdio especializado em produtos personalizados com acabamento premium, catálogo dinâmico em SQLite local e painel administrativo integrado.

---

## 1. Visão Geral da Arquitetura

O projeto foi estruturado para aliar alta performance de carregamento, simplicidade de manutenção por desenvolvedor solo e facilidade de evolução incremental:

- **Framework Web:** [Astro](https://astro.build/) com TypeScript em modo híbrido (`output: 'hybrid'`) com `@astrojs/node`. Permite renderização estática e dinâmica sob demanda sem necessidade de rebuild ao atualizar produtos no catálogo.
- **Banco de Dados Local:** [SQLite](https://sqlite.org/) gerenciado via `@libsql/client` com persistência em arquivo local (`data/studio678.db`). Consultas 100% parametrizadas para proteção contra SQL Injection.
- **Painel Administrativo:** Acessível em `/admin` para criação, edição, ordenação, visibilidade e exclusão de produtos em tempo real, além de upload de imagens para `public/uploads/`.
- **Design & Estilos:** [Tailwind CSS](https://tailwindcss.com/) com paleta customizada (`studio` e `gold`), tipografia hierárquica e componentes responsivos com scroll horizontal suave.
- **Testes Unitários:** [Vitest](https://vitest.dev/) com 19 testes unitários cobrindo utilitários de atendimento WhatsApp e todas as operações do repositório SQLite em memória.

---

## 2. Estrutura de Diretórios

```text
site678Estudio/
├── data/                 # Banco de dados SQLite local (studio678.db)
├── public/
│   ├── images/demo/      # Fotografias demonstrativas de estúdio
│   └── uploads/          # Imagens enviadas via painel administrativo
├── src/
│   ├── components/       # Componentes de apresentação isolados
│   │   ├── CategorySection.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── ProductCard.astro
│   │   └── WhatsAppCTA.astro
│   ├── db/               # Camada de banco de dados SQLite
│   │   ├── database.ts
│   │   ├── catalogRepository.ts
│   │   └── catalogRepository.test.ts
│   ├── layouts/          # Layout base com meta tags e estrutura global
│   │   └── BaseLayout.astro
│   ├── pages/            # Rotas públicas, administrativas e API
│   │   ├── admin/
│   │   │   └── index.astro
│   │   ├── api/
│   │   │   ├── categories.ts
│   │   │   ├── upload.ts
│   │   │   └── products/
│   │   │       ├── index.ts
│   │   │       └── [id].ts
│   │   └── index.astro
│   ├── types/            # Contratos de tipos TypeScript
│   └── utils/            # Utilitários puros
├── astro.config.mjs      # Configuração híbrida do Astro com adapter Node
├── tailwind.config.mjs   # Configuração e tema do Tailwind
├── tsconfig.json         # Configurações TypeScript estritas
├── vitest.config.ts      # Configurações da suíte de testes Vitest
├── package.json          # Dependências e scripts
└── README.md             # Documentação técnica
```

---

## 3. Comandos de Execução

### Instalação de Dependências
```bash
pnpm install
```

### Executar em Desenvolvimento
```bash
pnpm dev
```
O site estará acessível em `http://localhost:4321`. Para abrir o painel em `/admin`, defina `ADMIN_USERNAME` e `ADMIN_PASSWORD` no ambiente do processo.

### Executar Testes Unitários
```bash
pnpm test
```

### Checagem Estática de Tipos
```bash
pnpm exec astro check
```

### Compilar para Produção
```bash
pnpm build
```

---

## 4. Status de Entrega

- [x] **Fundação e Layout:** Logomarca oficial, temas claro e escuro com preferência local, hero editorial em duas colunas e navegação responsiva.
- [x] **Imagens de Estúdio:** Fotografias reais demonstrativas para as 4 linhas (Quadros, Canecas, Agendas e Madeira).
- [x] **Banco de Dados SQLite:** Persistência em `data/studio678.db`, migração automática e repositório parametrizado.
- [x] **Painel Administrativo (`/admin`):** Métricas, ordenação, visibilidade imediata, edição, exclusão e upload local de imagens sem rebuild.
- [x] **API REST:** Endpoints `/api/categories`, `/api/products`, `/api/upload` e `/api/mockup/save`.
- [x] **Personalizadores Interativos:** Caneca 3D em Three.js (20 × 9 cm com rotação 360°) e Quadro 30 × 40 cm em ambientes contextualizados (Sala e Escritório) com exportação direta para WhatsApp.
- [x] **Testes Unitários:** Utilitários, tema, catálogo e operações SQLite cobertos pela suíte Vitest.

## 5. Deploy GitOps no Portainer

O `compose.yaml` na raiz foi preparado para **Docker Standalone**. O GitHub Actions constrói e testa a imagem Linux para AMD64 e ARM64 e publica no GHCR a tag `sha-<commit>`. Quando a variável do repositório `PORTAINER_AUTO_DEPLOY` vale `true`, o workflow também atualiza a tag `stable` e pode chamar o webhook GitOps. O contêiner executa `node dist/server/entry.mjs` como usuário sem privilégios.

1. Após revisar e publicar os arquivos no GitHub, aguarde o primeiro build de **Publicar imagem Docker**. Para usar essa imagem antes de habilitar a automação, informe sua tag `sha-<commit>` em `IMAGE_TAG`. Mantenha o pacote GHCR privado e confirme que a conta usada no Portainer pode lê-lo.
2. No Portainer, cadastre `ghcr.io` como registro autenticado. Para puxar a imagem privada, use uma conta com acesso ao pacote e um PAT clássico com `read:packages`. Em **Stacks → Add stack → Git repository**, use `https://github.com/mlacunha/678estudio.git`, referência `refs/heads/main` e caminho `compose.yaml`. Nas credenciais Git, use o usuário e o PAT com leitura do repositório privado. As credenciais do Git e do registro têm finalidades distintas.
3. Crie os diretórios persistentes no **host Docker**, fora da pasta que o Portainer clona. Garanta leitura e escrita para o UID/GID 1000 do contêiner. Se quiser aproveitar dados anteriores, copie o SQLite com o processo antigo parado e copie os uploads antes de iniciar a stack. Acompanhe backups dos dois diretórios.
4. Preencha as credenciais administrativas e os caminhos persistentes abaixo e instale a stack. Deixe `PUBLIC_ORIGIN` em branco. Com o bind padrão, teste em `http://localhost:4321` no próprio servidor. As prévias geradas nessa fase usam o endereço acessado e seus links são provisórios, adequados apenas a quem consegue alcançar esse endereço.
5. Quando for configurar o **Cloudflare Tunnel existente**, altere `HOST_BIND` para o IP local do servidor, se o conector precisar acessar a aplicação pela rede. Atualize a stack e configure a rota publicada do túnel com origem `http://IP_LOCAL_DO_SERVIDOR:4321`, usando `HOST_PORT` se tiver escolhido outra porta. O conector precisa alcançar esse IP e porta. Restrinja o acesso direto à rede necessária para o túnel, mantendo a porta fechada na internet. A stack usa a rede padrão do Compose.
6. Depois que o domínio HTTPS estiver disponível, defina `PUBLIC_ORIGIN` no Portainer e atualize a stack. A configuração entra no novo contêiner com a mesma imagem. Novos links de mockup passam a usar o domínio HTTPS, e o painel deve ser acessado pelo endereço público para que os formulários usem a origem autorizada.
7. Se quiser habilitar o deploy automático, selecione **Webhook** em **GitOps updates** e habilite **Re-pull image** e **Force redeployment**. Salve a URL HTTPS alcançável pelo runner como segredo `PORTAINER_WEBHOOK_URL` em **GitHub → Settings → Secrets and variables → Actions**, defina a variável de repositório `PORTAINER_AUTO_DEPLOY=true` e use `IMAGE_TAG=stable` no Portainer. Mantenha o webhook direto de push e o polling desativados para essa stack. Consulte os eventos no Portainer para confirmar a recriação do contêiner.

| Variável | Valor |
|---|---|
| `HOST_PORT` | Porta publicada no host. Padrão `4321`. A porta interna é sempre `4321`. |
| `HOST_BIND` | Endereço de bind no host. Padrão `127.0.0.1`. Use o IP local do servidor para acesso pela rede. |
| `PUBLIC_ORIGIN` | Opcional. Deixe em branco para usar a origem da requisição durante os testes. Após configurar o domínio, informe a origem HTTPS pública, por exemplo `https://estudio.example.com`, sem subcaminho. |
| `ADMIN_USERNAME` e `ADMIN_PASSWORD` | Credenciais de HTTP Basic Auth, definidas no Portainer. O usuário não pode conter dois-pontos. |
| `DATA_DIR` | Diretório absoluto do host, montado em `/app/data`. Contém `studio678.db`. |
| `UPLOADS_DIR` | Diretório absoluto do host, montado em `/app/public/uploads`. O subdiretório `mockups/` usa o mesmo armazenamento. |
| `IMAGE_TAG` | Opcional. Use `stable` para atualização automática ou `sha-<commit>` para manter uma revisão específica. |

Mantenha uma única réplica para o SQLite e os limites locais de mockups. A geração pública aceita até 10 MB por PNG, 20 requisições válidas para processamento por janela de 60 segundos, uma em andamento e até 200 entradas no diretório de prévias. Os links de prévia são públicos para quem os possui. Se atingir a capacidade, remova os mockups antigos do diretório persistente conforme a política de retenção do estúdio.

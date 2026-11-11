# Painel Administrativo — Tarefas de Implementação

> Tarefas executáveis para reproduzir a unit `admin` a partir do legado.

## Pré-requisitos
- [x] Repositórios `catalogRepository` e `studioSettings` disponíveis

## Tarefas
- [x] **T-01**: Implementar página `/admin/index.astro` com tabela de catálogo e modal de edição.
  - Origem no legado: [`src/pages/admin/index.astro`](file:///d:/Projetos/site678Estudio/src/pages/admin/index.astro)
  - Critério de pronto: Permite alterar visibilidade, título, descrição e imagem de produtos. 🟢
- [x] **T-02**: Implementar serviço de persistência de contatos e validação de redes sociais em `studioSettings.ts`.
  - Origem no legado: [`src/db/studioSettings.ts:15-54`](file:///d:/Projetos/site678Estudio/src/db/studioSettings.ts#L15-L54)
  - Critério de pronto: Validação de URLs HTTPS de Instagram/Facebook e formatação de telefone. 🟢
- [x] **T-03**: Criar páginas de visualização de orçamentos e galeria de trabalhos.
  - Origem no legado: `src/pages/admin/agendas/`, `src/pages/admin/trabalhos/`
  - Critério de pronto: Consulta e exibição ordenada dos registros de clientes e fotos. 🟢

## Tarefas de Teste
- [x] **TT-01**: Teste unitário de `validateStudioSettings` com URLs sociais inválidas e válidas.
- [x] **TT-02**: Teste de persistência e recuperação do registro único de configurações.


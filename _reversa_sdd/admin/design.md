# Painel Administrativo — Design Técnico

> Especificação técnica da unit `admin`. Foca no COMO a unit é construída.

## Interface

### Páginas SSR do Painel (`src/pages/admin/`)
- `/admin`: Visão geral do catálogo, modal de edição rápida e formulário de configurações do estúdio.
- `/admin/agendas`: Listagem cronológica de orçamentos solicitados (`agenda_quotes`).
- `/admin/trabalhos`: Interface de upload e ordenação de obras da galeria (`gallery_works`).
- `/admin/estudio`: Ferramentas internas para geração de imagens de catálogo e mockups.
- `/admin/backup`: Rota de download e restauração da base SQLite.

### Serviços Utilizados
- `src/db/studioSettings.ts`: Funções `getStudioSettings`, `saveStudioSettings`, `validateStudioSettings`.
- `src/db/catalogRepository.ts`: Funções `getAllCategories`, `getAllProducts`, `updateProduct`.

## Fluxo Principal de Atualização de Contatos
1. O formulário em `/admin` dispara uma requisição `POST` com os dados do formulário (`Astro.request.formData()`).
2. `validateStudioSettings(settings)` sanitiza URLs sociais e o número de WhatsApp.
3. Se houver erros, retorna código HTTP 422 com mapa de erros exibido nos campos.
4. Se válido, invoca `saveStudioSettings(settings)`, persistindo no SQLite com `INSERT ... ON CONFLICT (id) DO UPDATE`.
5. Redireciona com status 303 para `/admin?contatos=salvos#configuracoes-estudio`.

## Riscos e Lacunas
- 🔴 Ausência de tela de login e controle de sessão por cookies/JWT no nível do Astro (atualmente confiando em segurança perimetral).


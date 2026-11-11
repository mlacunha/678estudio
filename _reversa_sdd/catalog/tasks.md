# Catálogo de Produtos e Categorias — Tarefas de Implementação

> Tarefas executáveis para reproduzir a unit `catalog` a partir do legado.

## Pré-requisitos
- [x] Base de dados configurada com tabelas `categories` e `products`
- [x] Tipagem TypeScript definida em `src/types/catalog.ts`

## Tarefas
- [x] **T-01**: Implementar repositório com queries parametrizadas em `catalogRepository.ts`.
  - Origem no legado: [`src/db/catalogRepository.ts:33-142`](file:///d:/Projetos/site678Estudio/src/db/catalogRepository.ts#L33-L142)
  - Critério de pronto: Todas as 10 funções CRUD exportadas e tipadas. 🟢
- [x] **T-02**: Criar endpoints REST `/api/categories` com suporte ao filtro `?all=true`.
  - Origem no legado: [`src/pages/api/categories.ts:6-21`](file:///d:/Projetos/site678Estudio/src/pages/api/categories.ts#L6-L21)
  - Critério de pronto: Retorno 200 com array formatado. 🟢
- [x] **T-03**: Criar endpoints REST `/api/products` com listagem e criação POST.
  - Origem no legado: [`src/pages/api/products/index.ts:7-71`](file:///d:/Projetos/site678Estudio/src/pages/api/products/index.ts#L7-L71)
  - Critério de pronto: Suporta filtragem por `?category=` e validação 400 em campos vazios. 🟢
- [x] **T-04**: Criar endpoints REST `/api/products/[id]` para consulta, atualização parcial e exclusão.
  - Origem no legado: [`src/pages/api/products/[id].ts:7-76`](file:///d:/Projetos/site678Estudio/src/pages/api/products/[id].ts#L7-L76)
  - Critério de pronto: Suporta `toggleActive` dedicado e retorno 404 para IDs inexistentes. 🟢

## Tarefas de Teste
- [x] **TT-01**: Teste unitário de criação de produto e consulta por categoria em Vitest.
- [x] **TT-02**: Teste de validação para payload inválido (400 Bad Request).
- [x] **TT-03**: Teste de integridade de queries parametrizadas contra SQL Injection.

## Lacunas Pendentes (🔴)
- Proteger rotas de mutação com middleware de autenticação antes de exposição externa irrestrita.


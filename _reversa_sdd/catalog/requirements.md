# Catálogo de Produtos e Categorias — Requisitos

> Especificação de requisitos da unit `catalog`. Foca no QUE a unit faz.

## Visão Geral
Gerenciamento e disponibilização do catálogo de produtos e categorias do 678 Estudio. Provê consultas públicas com filtros de visibilidade e operações administrativas completas de CRUD com ordenação customizável.

## Responsabilidades
- Listar categorias ativas para navegação e filtros.
- Listar produtos ativos por categoria ou todos os produtos para a vitrine.
- Permitir criação, atualização de dados, troca de imagem, ativação/desativação e exclusão de itens via API.

## Regras de Negócio
- **RN-CAT-01**: Apenas categorias e produtos com `is_active = 1` são exibidos em consultas públicas regulares. 🟢
- **RN-CAT-02**: A ordenação de exibição segue `display_order ASC`. Produtos sem ordem recebem `99`. 🟢
- **RN-CAT-03**: Cada produto deve pertencer a um slug válido (`quadros`, `canecas`, `papelaria`, `artesanato`). 🟢
- **RN-CAT-04**: O payload de criação deve conter obrigatoriamente `name`, `categorySlug` e `imageUrl`. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|---|---|---|---|
| RF-01 | Consultar categorias ativas | Must | GET `/api/categories` retorna array de categorias com `is_active = 1` |
| RF-02 | Consultar categorias completas | Should | GET `/api/categories?all=true` retorna todas as categorias para o admin |
| RF-03 | Consultar produtos por categoria | Must | GET `/api/products?category=canecas` retorna apenas produtos da categoria informada |
| RF-04 | Cadastrar novo produto | Must | POST `/api/products` com body JSON cria e persiste o produto, retornando 201 |
| RF-05 | Atualizar dados do produto | Must | PUT `/api/products/[id]` atualiza campos informados e retorna o objeto atualizado |
| RF-06 | Alternar status ativo | Must | PUT `/api/products/[id]` com `{ toggleActive: boolean }` altera `is_active` |
| RF-07 | Excluir produto | Must | DELETE `/api/products/[id]` remove o registro e retorna 200 |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|---|---|---|---|
| Integridade | Consultas SQL estritamente parametrizadas | `src/db/catalogRepository.ts:36` | 🟢 |
| Idempotência | Boot do schema do banco invocado antes de cada operação | `src/db/catalogRepository.ts:34` | 🟢 |
| Compatibilidade | SSR Híbrido com rotas dinâmicas desativando prerender | `src/pages/api/products/index.ts:5` | 🟢 |

## Critérios de Aceitação

```gherkin
Cenário: Listagem de produtos filtrados por categoria
  Dado que existem produtos cadastrados nas categorias "canecas" e "quadros"
  Quando o cliente envia uma requisição GET para "/api/products?category=canecas"
  Então a resposta deve ter status 200
  E conter apenas itens onde categorySlug seja "canecas" e isActive seja true

Cenário: Criação de produto sem campos obrigatórios
  Dado que o administrador tenta criar um produto sem o campo "imageUrl"
  Quando envia uma requisição POST para "/api/products"
  Então a resposta deve ter status 400
  E a mensagem de erro deve indicar "Campos obrigatórios ausentes"
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|---|---|---|
| RF-01, RF-03, RF-04, RF-05 | Must | Essenciais para a existência da vitrine e administração do catálogo |
| RF-02, RF-06 | Should | Otimizações operacionais para a gestão no painel |
| RF-07 | Could | Limpeza de registros descontinuados |


# Dicionário de Dados — 678 Estudio

Documento consolidado gerado na Fase de Escavação pelo Archaeologist.

---

## 1. Entidades de Domínio (TypeScript Interfaces & Types)

### 1.1 Product (`src/types/catalog.ts`)
| Campo | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `string` | Sim | `prod-<timestamp>` | Identificador único do produto |
| `categorySlug` | `CategorySlug` | Sim | - | Categoria pertencente (`quadros`, `canecas`, `papelaria`, `artesanato`) |
| `name` | `string` | Sim | - | Nome comercial do item |
| `tagline` | `string` | Sim | `""` | Slogan ou frase de destaque do produto |
| `description` | `string` | Sim | `""` | Descrição técnica e detalhada |
| `featuredBadge`| `string` | Não | `undefined` | Selo de destaque (ex: "Mais Vendido", "Novidade") |
| `imageUrl` | `string` | Sim | - | Caminho ou URL da imagem principal |
| `order` | `number` | Sim | `99` | Ordem de exibição na listagem |
| `isActive` | `boolean` | Sim | `true` | Indicador de visibilidade pública |
| `isProvisional`| `boolean` | Sim | `false` | Indica se é produto provisório aguardando fotos finais |

### 1.2 ProductCategory (`src/types/catalog.ts`)
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | Identificador da categoria (ex: `cat-quadros`) |
| `slug` | `CategorySlug` | Sim | Slug canônico para URLs e filtros |
| `title` | `string` | Sim | Título da categoria exibido no site |
| `subtitle` | `string` | Sim | Subtítulo explicativo |
| `description` | `string` | Sim | Descrição do setor criativo |
| `badge` | `string` | Sim | Rótulo para badge visual |

### 1.3 StudioSettings (`src/db/studioSettings.ts`)
| Campo | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `whatsapp` | `string` | Sim | `""` | Número oficial de WhatsApp com DDI +55 |
| `instagram` | `string` | Sim | `https://www.instagram.com/678estudio/` | URL completa do perfil no Instagram |
| `facebook` | `string` | Sim | `""` | URL completa da página no Facebook |
| `email` | `string` | Sim | `""` | E-mail de atendimento |

### 1.4 QuoteConfig (`src/server/agenda/quoteConfig.ts`)
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `template` | `'agenda-classica-v1' \| 'agenda-classica-v2'` | Sim | Versão do template Typst |
| `year` | `number` | Sim | Ano de referência (1900 a 9998) |
| `format` | `keyof typeof agendaFormats` | Sim | Formato de página (ex: `a5`, `executive`) |
| `layout` | `keyof typeof agendaLayouts` | Sim | Layout interno (`daily-1dpp`, `daily-2dpp`, `weekly`) |
| `style` | `keyof typeof agendaStyles` | Sim | Estilo visual (`classic`, `commercial`, `feminine`) |
| `colors` | `{ primary: string, secondary: string }` | Sim | Cores hexadecimais validadas com contraste WCAG >= 3:1 |
| `customColors` | `boolean` | Sim | Indica se cores personalizadas foram ativadas |
| `watermark` | `boolean` | Sim | Ativação de marca d'água de logo |
| `logo` | `null \| { originalName: string, ... }` | Sim | Informações do arquivo de logotipo |

---

## 2. Tabelas Relacionais SQLite (`studio678.db`)

### 2.1 Tabela `categories`
| Coluna | Tipo SQLite | PK | Nullable | Padrão | Restrições |
|---|---|---|---|---|---|
| `id` | `TEXT` | Sim | Não | - | Chave primária |
| `slug` | `TEXT` | Não | Não | - | `UNIQUE` |
| `title` | `TEXT` | Não | Não | - | - |
| `subtitle` | `TEXT` | Não | Não | - | - |
| `description`| `TEXT` | Não | Não | - | - |
| `badge` | `TEXT` | Não | Não | - | - |
| `display_order`| `INTEGER` | Não | Não | - | - |
| `is_active` | `INTEGER` | Não | Não | `1` | Booleano (0 ou 1) |

### 2.2 Tabela `products`
| Coluna | Tipo SQLite | PK | Nullable | Padrão | Restrições |
|---|---|---|---|---|---|
| `id` | `TEXT` | Sim | Não | - | Chave primária |
| `category_slug`| `TEXT` | Não | Não | - | Referência a `categories(slug)` |
| `name` | `TEXT` | Não | Não | - | - |
| `tagline` | `TEXT` | Não | Não | - | - |
| `description`| `TEXT` | Não | Não | - | - |
| `featured_badge`| `TEXT` | Não | Sim | `NULL` | Opcional |
| `image_url` | `TEXT` | Não | Não | - | Caminho local (`/images/...`) ou URL |
| `display_order`| `INTEGER` | Não | Não | - | - |
| `is_active` | `INTEGER` | Não | Não | `1` | Booleano (0 ou 1) |
| `is_provisional`| `INTEGER` | Não | Não | `1` | Booleano (0 ou 1) |

### 2.3 Tabela `site_settings`
| Coluna | Tipo SQLite | PK | Nullable | Padrão | Restrições |
|---|---|---|---|---|---|
| `id` | `INTEGER` | Sim | Não | - | `CHECK (id = 1)` (Linha única garantida) |
| `whatsapp` | `TEXT` | Não | Não | - | Telefone de contato/pedidos |
| `instagram` | `TEXT` | Não | Não | - | Perfil oficial |
| `facebook` | `TEXT` | Não | Não | - | Página oficial |
| `email` | `TEXT` | Não | Não | - | E-mail de atendimento |

### 2.4 Tabela `gallery_works`
| Coluna | Tipo SQLite | PK | Nullable | Padrão | Restrições |
|---|---|---|---|---|---|
| `id` | `TEXT` | Sim | Não | - | Chave primária |
| `title` | `TEXT` | Não | Não | - | Título do trabalho |
| `description`| `TEXT` | Não | Não | - | Descrição detalhada |
| `category_slug`| `TEXT` | Não | Não | - | `REFERENCES categories(slug)` |
| `work_date` | `TEXT` | Não | Sim | `NULL` | Data de entrega ou conclusão |
| `instagram` | `TEXT` | Não | Não | - | Link para postagem no Instagram |
| `published` | `INTEGER`| Não | Não | `0` | Booleano (0 ou 1) |
| `featured` | `INTEGER`| Não | Não | `0` | Booleano (0 ou 1) |
| `display_order`| `INTEGER`| Não | Não | `0` | Ordem de exibição |
| `created_at` | `TEXT` | Não | Não | - | Timestamp ISO 8601 |
| `updated_at` | `TEXT` | Não | Não | - | Timestamp ISO 8601 |
| `published_at`| `TEXT` | Não | Sim | `NULL` | Timestamp de publicação |
| `version` | `INTEGER`| Não | Não | `1` | Controle de concorrência otimista |

### 2.5 Tabela `gallery_photos`
| Coluna | Tipo SQLite | PK | Nullable | Restrições |
|---|---|---|---|---|
| `id` | `TEXT` | Sim | Não | Chave primária |
| `work_id` | `TEXT` | Não | Não | `REFERENCES gallery_works(id)` |
| `position` | `INTEGER`| Não | Não | Posição sequencial da foto na galeria |
| `width` | `INTEGER`| Não | Não | Largura em pixels da imagem original |
| `height` | `INTEGER`| Não | Não | Altura em pixels da imagem original |
| `thumb_width` | `INTEGER`| Não | Não | Largura em pixels da miniatura |
| `thumb_height`| `INTEGER`| Não | Não | Altura em pixels da miniatura |

*Restrição de Unicidade:* `UNIQUE(work_id, position)`.

### 2.6 Tabela `agenda_quotes`
| Coluna | Tipo SQLite | PK | Nullable | Restrições |
|---|---|---|---|---|
| `id` | `TEXT` | Sim | Não | Chave primária (UUID v4) |
| `draft_token`| `TEXT` | Não | Não | `UNIQUE` |
| `product` | `TEXT` | Não | Não | Nome do produto base ('Agenda Clássica') |
| `created_at` | `TEXT` | Não | Não | Data/hora de solicitação |
| `status` | `TEXT` | Não | Não | `CHECK (status = 'requested')` |
| `config_version`| `INTEGER`| Não | Não | Versão do schema de configuração |
| `config_json`| `TEXT` | Não | Não | JSON serializado de `QuoteConfig` |

### 2.7 Tabela `agenda_quote_assets`
| Coluna | Tipo SQLite | PK | Nullable | Restrições |
|---|---|---|---|---|
| `quote_id` | `TEXT` | Sim | Não | `REFERENCES agenda_quotes(id) ON DELETE CASCADE` |
| `name` | `TEXT` | Sim | Não | `CHECK (name IN ('original', 'logo', 'preview-1'...'preview-8'))` |
| `mime` | `TEXT` | Não | Não | Mime-type (`image/png`, `application/pdf`, etc.) |
| `content` | `BLOB` | Não | Não | Dados binários brutos do arquivo |

*Chave Primária Composta:* `PRIMARY KEY (quote_id, name)`.

### 2.8 Tabela `schema_migrations`
| Coluna | Tipo SQLite | PK | Nullable | Restrições |
|---|---|---|---|---|
| `id` | `TEXT` | Sim | Não | Identificador unívoco da migration (ex: `'stationery-families-v2'`) |

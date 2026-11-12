# Interface: Endpoints de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`
> Padrão: REST HTTP / Astro Endpoints

## 1. Endpoints Públicos de Prévia de Capa

### `POST /api/cover/preview`

Gera imagens em alta definição (PNG ou SVG) da capa frontal, contracapa ou mockup realista para visualização instantânea no navegador.

#### Parâmetros de Requisição (Multipart Form Data ou JSON)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `style` | string | Sim | `classic`, `modern` ou `photographic`. |
| `typography` | string | Sim | `modern`, `geometric` ou `editorial`. |
| `title` | string | Sim | Título da capa (ex: "Agenda 2027", "Minhas Receitas"). |
| `name` | string | Não | Nome personalizado (ex: "Mariana Souza"). |
| `subtitle` | string | Não | Subtítulo ou ano opcional. |
| `primaryColor` | string | Sim | Cor hexadecimal (ex: `#1e3a8a`). |
| `secondaryColor` | string | Sim | Cor secundária (ex: `#f8fafc`). |
| `textColor` | string | Sim | Cor do texto com validação de contraste WCAG $\ge 3:1$. |
| `target` | string | Sim | `front`, `back` ou `mockup`. |
| `image` | File | Não | Imagem enviada para capa fotográfica (PNG/JPEG até 5 MB). |
| `zoom` | number | Não | Fator de zoom da imagem (100 a 250). |
| `offsetX` | number | Não | Deslocamento horizontal (-100 a 100). |
| `offsetY` | number | Não | Deslocamento vertical (-100 a 100). |

#### Respostas

- **200 OK**: Imagem direta em `image/png` com cache HTTP curto ou `image/svg+xml`.
- **400 Bad Request**: Validação de parâmetros falhou (ex: cores sem contraste suficiente ou formato de imagem inválido).
- **500 Internal Server Error**: Erro de compilação ou renderização no motor.

---

## 2. Endpoints Administrativos de Geração de Produção

### `GET /admin/[family]/[id]/cover-pdf`

Compila e devolve o PDF vetorial em escala 1:1 pronto para impressão.

#### Parâmetros de Query

| Parâmetro | Tipo | Valores permitidos | Descrição |
|-----------|------|--------------------|-----------|
| `format` | string | `front-a5`, `back-a5`, `combined-a4` | Seleção do formato de arquivo. |
| `bleed` | string | `3mm`, `5mm` | Sangria técnica (aplicável aos formatos A5). |

#### Headers de Resposta

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="capa-[id]-[format].pdf"
```


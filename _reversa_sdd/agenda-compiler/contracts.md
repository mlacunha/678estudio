# Motor de Diagramação de Agendas — Contratos Operacionais

> Especificação de contratos externos (CLI e HTTP) da unit `agenda-compiler`.

## 1. Contrato de Invocação do Typst CLI

### Argumentos de Linha de Comando:
```bash
typst compile \
  --root <caminho_templates> \
  --font-path <caminho_fonts> \
  --ignore-system-fonts \
  --ignore-embedded-fonts \
  --jobs 2 \
  --input layout={daily-1dpp|daily-2dpp|weekly} \
  --input year={1900..9998} \
  --input style={classic|commercial|feminine} \
  --input format={a5|executive} \
  --input primary={#hex} \
  --input secondary={#hex} \
  [--input custom-colors=true] \
  [--input logo=true] \
  [--input watermark=true] \
  [--format png --pages 1,2,3,4,16,17,...] \
  classic.typ <caminho_saida_ou_hifen>
```

---

## 2. Contrato de API: `/api/agenda/quote`

### Requisição:
- **Método**: `POST`
- **Content-Type**: `application/json`
- **Payload**:
```json
{
  "template": "agenda-classica-v2",
  "year": 2026,
  "format": "a5",
  "layout": "daily-1dpp",
  "style": "classic",
  "colors": {
    "primary": "#1d4ed8",
    "secondary": "#64748b"
  },
  "customColors": false,
  "watermark": false,
  "logo": null
}
```

### Resposta de Sucesso:
- **Status**: `201 Created`
- **Body**:
```json
{
  "success": true,
  "quoteId": "550e8400-e29b-41d4-a716-446655440000",
  "quoteUrl": "/agenda/orcamento/550e8400-e29b-41d4-a716-446655440000"
}
```


# Máquinas de Estado — 678 Estudio

Documento consolidado gerado na Fase de Interpretação pelo Detective.

---

## 1. Ciclo de Vida do Produto (`Product`)

Os produtos cadastrados no catálogo transitam entre estados de visibilidade e estado de acabamento visual.

```mermaid
stateDiagram-v2
    [*] --> ProvisorioAtivo : Inserção via POST /api/products (is_active = 1, is_provisional = 1)
    [*] --> DefinitivoAtivo : Inserção com foto de estúdio (is_active = 1, is_provisional = 0)
    
    ProvisorioAtivo --> DefinitivoAtivo : Fotografia final de estúdio cadastrada (replaceProductImage / update)
    ProvisorioAtivo --> Desativado : toggleActive(false) no Painel Admin
    
    DefinitivoAtivo --> Desativado : toggleActive(false) no Painel Admin
    Desativado --> DefinitivoAtivo : toggleActive(true) no Painel Admin
    Desativado --> ProvisorioAtivo : toggleActive(true) no Painel Admin
    
    Desativado --> [*] : DELETE /api/products/[id]
    ProvisorioAtivo --> [*] : DELETE /api/products/[id]
    DefinitivoAtivo --> [*] : DELETE /api/products/[id]
```

### Transições e Gatilhos:
- **`ProvisorioAtivo` → `DefinitivoAtivo`**: Quando a equipe do estúdio fotografa o produto físico real e faz o upload da foto em `/admin`, substituindo a imagem de mockup provisória.
- **`*` → `Desativado`**: Quando o item está temporariamente sem estoque de matéria-prima (ex: falta de cerâmica ou madeira). O item não é excluído, apenas ocultado da vitrine pública.
- **`*` → `Excluído`**: Exclusão definitiva do banco de dados quando a linha é descontinuada.

---

## 2. Ciclo de Vida do Orçamento de Agenda (`AgendaQuote`)

As solicitações de orçamentos de agenda e planner geradas pelo cliente via Typst.

```mermaid
stateDiagram-v2
    [*] --> RascunhoCriado : Cliente configura layout, cores e envia logo (/api/agenda/preview)
    RascunhoCriado --> Solicitado : Cliente clica em 'Solicitar Orçamento' (/api/agenda/quote)
    note right of Solicitado : Status 'requested' registrado em agenda_quotes com draft_token único e assets gerados
    
    Solicitado --> EmAtendimento : Administrador visualiza no painel /admin/agendas e inicia conversa no WhatsApp
    EmAtendimento --> ProducaoIniciada : Arte e pagamento aprovados pelo cliente
    ProducaoIniciada --> Entregue : Impressão concluída e enviada ao cliente
    Solicitado --> ExpiradoCancelado : Cotação abandonada após período de inatividade
```

---

## 3. Ciclo de Vida dos Trabalhos do Portfólio (`GalleryWork`)

Obras e fotos de peças personalizadas exibidas na seção `/trabalhos`.

```mermaid
stateDiagram-v2
    [*] --> RascunhoObra : Cadastro de obra e upload de fotos no admin (published = 0)
    RascunhoObra --> Publicada : Admin ativa 'Publicar' (published = 1, published_at preenchido)
    Publicada --> Destaque : Admin marca como 'Destaque' (featured = 1)
    Destaque --> Publicada : Admin remove destaque (featured = 0)
    Publicada --> RascunhoObra : Admin despublica para ajustes de fotos
    RascunhoObra --> [*] : Exclusão da obra
```


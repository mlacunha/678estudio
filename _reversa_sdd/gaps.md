# Lacunas e Pontos de Atenção — 678 Estudio

Documento consolidado de lacunas técnicas e de negócio identificadas na revisão das especificações.

---

## 1. Severidade Alta (Bloqueante para Produção Pública)
- **GAP-01: Proteção e Autenticação do Painel Admin**
  - **Localização:** `src/pages/admin/*`, `src/pages/api/products/*`
  - **Descrição:** Mutações de catálogo e leitura de cotações não possuem camada de controle de acesso (ACL) no código da aplicação.
  - **Ação:** Requer decisão documentada em `questions.md#pergunta-1`.

---

## 2. Severidade Moderada (Eficiência Operacional e Manutenção)
- **GAP-02: Retenção e Expiração de Mockups e Ativos Binários**
  - **Localização:** `src/pages/api/mockup/save.ts`, tabela `agenda_quote_assets`
  - **Descrição:** Snapshots e prévias acumuladas sem política de ciclo de vida (TTL).
  - **Ação:** Configurar rotina de faxina ou limpeza periódica (ver `questions.md#pergunta-2`).
- **GAP-03: Degradação Graciosa do Motor Typst**
  - **Localização:** `src/server/agenda/classic.mjs`
  - **Descrição:** Falha não tratada com clareza se o binário `typst` não estiver acessível no servidor.
  - **Ação:** Implementar verificação de health-check e fallback amigável (ver `questions.md#pergunta-3`).

---

## 3. Severidade Baixa (Otimizações Futuras)
- **GAP-04: Paginação de Catálogo**
  - **Localização:** `src/db/catalogRepository.ts:60`
  - **Descrição:** `getAllProducts()` busca a totalidade dos registros em uma única query.
  - **Ação:** Introduzir `LIMIT` e `OFFSET` quando a base ultrapassar 200 produtos.
- **GAP-05: Compressão de Imagens na Vitrine**
  - **Localização:** `src/components/ProductCard.astro`
  - **Descrição:** Imagens servidas no formato original sem conversão automática para WebP/AVIF.
  - **Ação:** Integrar o serviço de imagens nativo do Astro (`astro:assets`).


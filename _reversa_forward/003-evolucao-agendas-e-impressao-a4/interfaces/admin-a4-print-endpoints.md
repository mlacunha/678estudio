# Interface: Endpoints Administrativos de Impressão A4 e Calibração

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`
> Tipo: `HTTP`

## 1. Download de PDF de Agenda (A5 Original ou Imposição A4)

- **Rota:** `POST /admin/agenda-classica.pdf` e `GET /admin/agenda-classica.pdf`
- **Parâmetros de Query (`URLSearchParams`):**
  - `pedido` (obrigatório para pedido salvo): ID do pedido em `agenda_quotes`.
  - `modo` (opcional, padrão `'a5'`): `'a5' | 'a4-frentes' | 'a4-versos'`.
  - `empilhamento` (opcional, padrão `'cut-stack'`): `'cut-stack' | 'sequential'`.
  - `virada` (opcional, padrão `'short-edge'`): `'short-edge' | 'long-edge'`.
  - `ordem` (opcional, padrão `'normal'`): `'normal' | 'reverse'`.
  - `escala` (opcional, padrão `'full'`): `'full' | 'safe'`.
- **Respostas:**
  - `200 OK`: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="agenda-classica-<ano>-<id>-<modo>.pdf"`.
  - `400 Bad Request`: Quando qualquer parâmetro de impressão A4 contiver valor fora do domínio permitido.
  - `404 Not Found`: Pedido de agenda inexistente.
  - `409 Conflict`: Configuração ou logomarca indisponível.

## 2. Download de PDF de Planner (A5 Original ou Imposição A4)

- **Rota:** `GET /admin/planners/[id]/pdf`
- **Parâmetros de Query (`URLSearchParams`):**
  - `modo` (opcional, padrão `'a5'`): `'a5' | 'a4-frentes' | 'a4-versos'`.
  - `empilhamento` (opcional, padrão `'cut-stack'`): `'cut-stack' | 'sequential'`.
  - `virada` (opcional, padrão `'short-edge'`): `'short-edge' | 'long-edge'`.
  - `ordem` (opcional, padrão `'normal'`): `'normal' | 'reverse'`.
  - `escala` (opcional, padrão `'full'`): `'full' | 'safe'`.
- **Respostas:**
  - `200 OK`: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="planner-essencial-<periodo>-<id>-<modo>.pdf"`.
  - `400 Bad Request`: Parâmetros de imposição A4 inválidos.
  - `404 Not Found`: Solicitação de planner não encontrada.

## 3. Download da Folha de Calibração A4

- **Rota:** `GET /admin/impressao-a4/calibracao.pdf`
- **Parâmetros de Query (`URLSearchParams`):**
  - `virada` (opcional, padrão `'short-edge'`): `'short-edge' | 'long-edge'`.
  - `escala` (opcional, padrão `'full'`): `'full' | 'safe'`.
- **Respostas:**
  - `200 OK`: `Content-Type: application/pdf`, PDF vetorial de 2 páginas A4 paisagem (`Frente de Calibração` e `Verso de Calibração`), `Content-Disposition: attachment; filename="calibracao-a4-corte-a5-<virada>-<escala>.pdf"`.
  - `400 Bad Request`: Parâmetros inválidos.


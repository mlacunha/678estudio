# Motor de Diagramação de Agendas — Design Técnico

> Especificação técnica da unit `agenda-compiler`. Foca no COMO a unit é construída.

## Interface

### Endpoints HTTP (`src/pages/api/agenda/`)

| Método | Caminho | Entrada | Saída | Status Codes |
|---|---|---|---|---|
| POST | `/api/agenda/preview` | JSON com `AgendaConfig` | `{ pages: { page, dataUrl }[] }` | 200, 400, 500 |
| POST | `/api/agenda/quote` | JSON com `AgendaConfig` e dados de cliente | `{ success: true, quoteId: string }` | 201, 400, 500 |

### Funções do Motor Typst (`src/server/agenda/classic.mjs`)

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `compileClassicAgenda` | `(config, preview?)` | `Promise<Buffer>` | Executa o binário do Typst com isolamento |
| `renderAgendaPreview` | `(config)` | `Promise<Object>` | Compila as 8 páginas mais relevantes |
| `isAgendaColor` | `(color)` | `boolean` | Validação de contraste $\ge 3:1$ com fórmula de luminância |
| `isClassicAgendaConfig` | `(layout, year)` | `boolean` | Valida integridade do ano e layout |

## Pipeline de Execução Typst
1. Validação prévia da configuração (ano, formato, layout, paleta de cores).
2. Se houver logotipo de cliente, cria workspace temporário via `mkdtemp(join(tmpdir(), '678-agenda-logo-'))`.
3. Montagem dos argumentos de linha de comando:
   ```
   compile --root <templates> --font-path <fonts> --ignore-system-fonts --ignore-embedded-fonts
   --jobs 2 --input layout=... --input year=... --input style=... --input format=...
   --input primary=... --input secondary=...
   ```
4. Se for prévia: adiciona `--format png --pages 1,2,3,4,16,17,...`.
5. Se for miolo integral: adiciona `--format pdf`.
6. Execução via `promisify(execFile)` do binário `typst`.
7. O buffer retornado no stdout é transmitido na resposta HTTP ou armazenado em banco.
8. Limpeza assíncrona do diretório temporário no bloco `finally`.

## Riscos e Lacunas
- 🔴 Se o binário `typst` não estiver presente no PATH do sistema, a operação falhará com erro `ENOENT`.


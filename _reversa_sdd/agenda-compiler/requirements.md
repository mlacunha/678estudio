# Motor de Diagramação de Agendas — Requisitos

> Especificação de requisitos da unit `agenda-compiler`. Foca no QUE a unit faz.

## Visão Geral
Motor automatizado de diagramação e compilação de agendas anuais e planners personalizados. Utiliza o compilador moderno Typst via CLI para produzir documentos vetoriais em PDF prontos para impressão gráfica e gerar prévias PNG de alta fidelidade para aprovação do cliente.

## Responsabilidades
- Compilar miolos de agendas anuais personalizadas em PDF vetorial.
- Gerar prévias das 8 páginas essenciais da agenda em PNG para visualização ágil.
- Validar conformidade de cores personalizadas segundo contraste de acessibilidade WCAG.
- Persistir e versionar rascunhos de orçamentos com tokens únicos na base de dados.

## Regras de Negócio
- **RN-AGE-01**: O ano da agenda deve ser um número inteiro estritamente entre 1900 e 9998. 🟢
- **RN-AGE-02**: Paletas personalizadas são submetidas a cálculo de luminância; o contraste com o fundo deve ser $\ge 3:1$. 🟢
- **RN-AGE-03**: A compilação deve rodar em diretório temporário isolado (`mkdtemp`) com limpeza obrigatória em bloco `finally`. 🟢
- **RN-AGE-04**: O orçamento aprovado é persistido em status `requested` com o JSON de configuração e prévias armazenadas. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|---|---|---|---|
| RF-01 | Renderizar prévia de agenda | Must | POST `/api/agenda/preview` retorna array de buffers PNG das páginas-chave |
| RF-02 | Criar solicitação de orçamento | Must | POST `/api/agenda/quote` persiste o rascunho e retorna o identificador UUID |
| RF-03 | Visualizar páginas de cotação | Should | GET `/agenda/orcamento/[id]/previa/[page]` serve a imagem PNG correspondente |
| RF-04 | Compilar PDF completo | Must | Compilação do miolo integral de 300-400 páginas via Typst com retorno em buffer |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|---|---|---|---|
| Performance | Timeout rigoroso de 15s para prévias e 60s para PDFs integrais | `src/server/agenda/classic.mjs:84` | 🟢 |
| Isolamento | Argumentos de CLI passados com fontes locais ignorando fontes do sistema | `src/server/agenda/classic.mjs:67` | 🟢 |
| Buffer | Limite máximo de buffer de 256KB para prévias e 16MB para PDFs | `src/server/agenda/classic.mjs:83` | 🟢 |


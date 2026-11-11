# Painel Administrativo — Requisitos

> Especificação de requisitos da unit `admin`. Foca no QUE a unit faz.

## Visão Geral
Área de retaguarda gerencial para a equipe do 678 Estudio. Oferece visualização e edição instantânea de produtos sem necessidade de re-compilar o site, alteração dos canais de contato e redes sociais, visualização de pedidos de agendas, gestão de portfólio de trabalhos realizados e rotinas de backup.

## Responsabilidades
- Gerenciar produtos (ativar, desativar, editar textos, substituir fotos e excluir).
- Atualizar contatos institucionais oficiais (WhatsApp, Instagram, Facebook, E-mail).
- Acompanhar cotações de agendas solicitadas por clientes.
- Gerenciar fotos da galeria de trabalhos realizados.
- Executar backups da base de dados SQLite.

## Regras de Negócio
- **RN-ADM-01**: A edição de contatos exige validação de integridade: número com DDI brasileiro `+55` e perfis HTTPS de `instagram.com` e `facebook.com`. 🟢
- **RN-ADM-02**: Alterações no catálogo refletem em tempo real no banco sem exigir reinicialização do servidor Node.js ou build Astro. 🟢
- **RN-ADM-03**: Backups são snapshots consistentes do arquivo `studio678.db`. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|---|---|---|---|
| RF-01 | Listar produtos e categorias no admin | Must | `/admin` exibe tabela consolidada de itens com badges de status |
| RF-02 | Atualizar configurações de contato | Must | Submissão do formulário salva na tabela `site_settings` e redireciona |
| RF-03 | Visualizar cotações de agendas | Should | `/admin/agendas` lista orçamentos pendentes com link para prévias |
| RF-04 | Gerenciar fotos de trabalhos | Should | `/admin/trabalhos` permite cadastrar novas fotos e ordenar posições |
| RF-05 | Executar rotina de backup | Could | `/admin/backup` gera snapshot para download do arquivo SQLite |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|---|---|---|---|
| Usabilidade | Feedback visual instantâneo com toasts e parâmetros de URL | `src/pages/admin/index.astro:28` | 🟢 |
| Segurança | Validação no servidor de comprimentos de campos ($\le 254$ caracteres) | `src/pages/admin/index.astro:21` | 🟢 |


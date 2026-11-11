# Papelaria Personalizada

A categoria mantém o slug `papelaria`, com três famílias: Agendas, Planners e Cadernos Personalizados. Imagem, título e botão de Agendas abrem `/personalizar/agenda`. As outras famílias exibem “Em preparação”. O registro de rotas e modelos fica em `src/data/stationery.ts`; rotas futuras só são expostas quando a família estiver disponível. Não foram criados geradores de planners ou cadernos.

## Migração SQLite

`stationery-families-v2` roda na inicialização, em transação, com registro em `schema_migrations`. Renomeia a categoria e cria `family-agendas`, `family-planners` e `family-cadernos`. Os produtos anteriores ficam inativos, sem exclusão. As famílias copiam uma imagem existente, priorizando nome compatível e imagem não provisória; a imagem e o indicador originais são preservados. Imagens de famílias já existentes não são sobrescritas. Registros e arquivos antigos continuam recuperáveis no painel.

A tabela de arquivos dos orçamentos é reconstruída transacionalmente para aceitar `preview-1` a `preview-8`, copiando integralmente os dados existentes. O backup aceita o esquema anterior e o novo, incluindo a tabela de migrações. Restaurar um backup antigo reaplica a migração na próxima inicialização; restaurar um novo mantém seu marcador.

## Miolo e prévias

O template `agenda-classica-v2` inclui abertura, calendário anual, dados pessoais, doze páginas de planejamento mensal, todos os dias/semanas do ano, controle financeiro básico e anotações. São 17 páginas além do layout anual. A prévia mostra oito páginas representativas, com nome da seção e número da página no PDF. Os PNGs são compilados pelo mesmo template completo, sem recorte ou versão HTML. Ano, estilo, paleta, logo e marca-d’água usam a mesma configuração de produção. A geração continua sob demanda.

O JSON de novos pedidos registra a versão do template e o mapa das prévias. Os nomes dos arquivos continuam sendo ordinais (`preview-1` etc.), enquanto `pdfPage` identifica a página de produção. Referências, originais, logo normalizada, imagens e configuração continuam salvos. Pedidos antigos sem esse mapa mostram suas três imagens originais e regeneram pelo `classic-v1.typ`, preservado integralmente. O envelope JSON permanece na versão 1, pois os novos campos são opcionais e o template identifica o formato do miolo.

## Validação

- Suíte Vitest com `AGENDA_TYPST_TEST=1`: migração idempotente, preservação de imagem administrativa e arquivos antigos, nove combinações de layout/estilo, anos bissextos, orçamento, WhatsApp, recuperação e regeneração de pedidos v1/v2.
- Testes Python de backup e restauração: bases antigas e migradas, oito prévias, integridade e reversão de falhas.
- Astro Check e build.
- Navegador local com banco isolado em `tmp/qa-papelaria`: três cards, navegação de Agendas, oito seções, ampliação, navegação e zoom; desktop e viewport 390 × 844; temas claro e escuro.
- Dockerfile preserva o binário Typst 0.15.1 e os downloads com checksum para AMD64/ARM64; nenhum serviço adicional. O daemon Docker local não está disponível, portanto os builds por arquitetura não foram executados.

Nenhum deploy ou alteração de dados de produção foi executado. A migração só chegará à produção quando a versão for implantada por quem administra o ambiente.

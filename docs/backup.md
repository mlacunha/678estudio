# Backup e restauração do 678 Estudio

O painel **Admin → Backup** usa os dois volumes já configurados no Compose.

| No contêiner | No ZIP | Conteúdo |
| --- | --- | --- |
| `/app/data/studio678.db` | `data/studio678.db` | Catálogo, contatos, registros da galeria e solicitações de agenda. Os originais, PNGs de produção, configurações e prévias das agendas estão no SQLite. |
| `/app/data/gallery-photos/` | `data/gallery-photos/` | Versões grande e miniatura das fotos dos trabalhos realizados. |
| `/app/public/uploads/` | `uploads/` | Imagens enviadas e publicadas no catálogo, inclusive as variantes grandes. |
| `/app/public/uploads/mockups/` | `uploads/mockups/` | Prévias persistentes de canecas e quadros, incluindo as já compartilhadas. |

As imagens estáticas do repositório acompanham a imagem Docker. Segredos de ambiente, PDFs gerados sob demanda, rascunhos de prévia, arquivos auxiliares do SQLite e o espaço interno `/app/data/.backup-restore` ficam fora do ZIP. O backup seleciona somente os nomes de mídia atendidos pela aplicação.

## Baixar

Selecione **Gerar e baixar ZIP**. O site aguarda os handlers em andamento e pausa novas solicitações durante a captura para manter o banco e as imagens relacionados ao mesmo estado. O SQLite é copiado pela API de backup e verificado antes de ser compactado. As requisições são retomadas antes da transferência ao navegador. O manifesto v1 contém data, descrição, tamanho e SHA-256 de cada arquivo. Guarde o ZIP em local privado, pois contém arquivos dos clientes.

## Restaurar

1. Baixe um backup atual e guarde-o fora do servidor.
2. No painel **Backup**, selecione o ZIP e clique em **Validar arquivo**. Confira a data, o número de arquivos e o tamanho.
3. Digite **RESTAURAR** e selecione **Restaurar e reiniciar o site**. O site volta sozinho e o painel mostra o resultado.

A validação prepara os arquivos em uma área privada e verifica nomes, hashes, versão, integridade do banco e referências às imagens da galeria e do catálogo. A confirmação registra a operação em disco. O supervisor espera o encerramento do processo Astro antes de iniciar a substituição, portanto as conexões SQLite da aplicação já estão fechadas. Os arquivos gerenciados que só existem no estado atual são removidos na restauração. Os demais arquivos dos volumes são preservados.

O supervisor salva uma cópia de reversão antes de substituir os dados. Em caso de falha durante a substituição, ele recupera o estado anterior. Se houver interrupção, o próximo início retoma a reversão antes de abrir o site. Se uma falha de armazenamento impedir a reversão, o site permanece parado e os arquivos de recuperação ficam em `/app/data/.backup-restore`. Corrija o problema de armazenamento antes de retomar a operação e preserve esse diretório até a recuperação.

O fluxo usa uma única instância do 678 Estudio com acesso de escrita aos dois volumes. O limite é de 512 MiB para o ZIP, 1 GiB descompactado e 10.000 arquivos. Reserve espaço para o arquivo recebido, o conteúdo preparado e uma cópia dos dados atuais. O proxy também precisa permitir o tamanho do envio. Use backups gerados pelo próprio painel. Os hashes verificam integridade e não autenticam a origem do arquivo.

O esquema SQLite v1 do backup corresponde às tabelas da aplicação atual. A rotina de inicialização existente cria as tabelas e índices de forma idempotente e roda novamente ao abrir o Astro. Backups incompatíveis ou que perderam arquivos referenciados são recusados. A substituição requer uma cópia reversível do SQLite atual.

## Testar localmente

Use uma pasta de trabalho isolada com o build e as pastas do aplicativo, com Node, Python 3.11 e o Typst já usado pelo projeto. O Docker inclui o Python e inicia o supervisor automaticamente. Fora do Docker, depois do build, o comando equivalente é `node src/server/backup/supervisor.mjs`. O modo de desenvolvimento permite baixar e validar, com a confirmação de restauração desabilitada.

Execute `python3 -B src/server/backup/test_engine.py` no Linux ou `python -B src/server/backup/test_engine.py` no Windows para os testes isolados do ZIP e do SQLite.

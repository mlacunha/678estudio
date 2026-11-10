# Agenda Clássica

## Orçamento e produção

No personalizador, gere as prévias e selecione **Solicitar orçamento pelo WhatsApp**. O mesmo botão salva a solicitação e abre o WhatsApp configurado no painel. A mensagem contém as opções principais e uma referência pública. O registro permanece no SQLite mesmo que o visitante feche o WhatsApp ou que o canal esteja indisponível. Novas tentativas com a mesma prévia retornam a mesma referência.

Em **Painel → Solicitações de agendas**, abra um registro da lista ou consulte pelo código exibido na referência. O detalhe mostra as opções e as prévias, permite baixar o original, o PNG de produção e o JSON versionado, e oferece **Gerar PDF completo** com a configuração salva. O PDF é gerado sob demanda e baixado pela rota administrativa protegida.

### Persistência

A inicialização cria `agenda_quotes` e `agenda_quote_assets` e seu índice de consulta, usando operações aditivas e idempotentes no SQLite existente. A solicitação, seu JSON de esquema 1, os originais validados, o PNG normalizado e as três imagens são gravados juntos. Os arquivos são BLOBs no volume `/app/data` e devem ser incluídos no backup do SQLite. Não é necessária uma migração manual nem um novo volume.

A referência usa um UUID aleatório independente do token de salvamento. Quem tiver o link pode ver as prévias e as opções principais. Os arquivos de produção e o JSON ficam sob a autenticação de `/admin`. O estado inicial `requested` indica que o site registrou a solicitação, sem confirmação de envio no WhatsApp.

Até o primeiro salvamento, a prévia e os arquivos ficam na memória por até 30 minutos, com limite de 24 rascunhos e 24 MiB por instância. Se o contêiner reiniciar ou o rascunho for removido por tempo ou capacidade, gere as prévias novamente. As opções simples e a última referência ficam na sessão do navegador. A logomarca selecionada fica no formulário aberto e precisa ser selecionada novamente após recarregar a página.

## Personalizador público

A página `/personalizar/agenda` oferece A5, anos 2027 e 2028, os três layouts e os estilos Clássico, Comercial e Feminino. O botão **Visualizar minha agenda** envia as opções por multipart para `POST /api/agenda/preview`. O Typst gera as páginas 1 a 3 com a mesma composição do miolo anual. A resposta JSON inclui os PNGs e o token temporário usado pelo `POST /api/agenda/quote`, com cache desabilitado.

A logomarca aceita PNG ou JPEG de até 2 MB e 4 megapixels. O Sharp decodifica o arquivo e gera um PNG de até 512 px no lado maior. A marca aparece no rodapé e pode também aparecer ao fundo, como marca-d’água. As cores opcionais exigem contraste mínimo de 3:1 contra o branco. Arquivos temporários são removidos após a compilação.

Cada instância aceita uma compilação pública de prévia por vez, com até 8 segundos para receber o formulário e até 15 segundos para compilar. Ao testar em HTTP local, deixe `PUBLIC_ORIGIN` vazio para usar a origem local.

O gerador interno `compileClassicAgenda` aceita as mesmas opções de estilo, formato e identidade, inclusive o PNG já normalizado, e pode produzir o PDF anual completo. A rota administrativa e o comando da fase 1 continuam disponíveis.

## Gerar os três miolos

Com Node e Typst 0.15.1 no `PATH`, execute o comando na raiz do projeto. [Versão do Typst](https://github.com/typst/typst/releases/tag/v0.15.1)

```sh
npm run agenda:poc -- 2027
```

Também é possível indicar o caminho do compilador com `TYPST_BINARY`. O comando usa 2027 por padrão e imprime o caminho da pasta criada em `output/pdf/agenda-classica/`. Cada execução gera três PDFs anuais e as páginas 1 e 2 de cada layout em PNG. Passe um segundo argumento para escolher o diretório pai da saída.

| Layout | ID | Páginas em 2027 |
| --- | --- | ---: |
| Um dia por página | `daily-1dpp` | 365 |
| Dois dias por página | `daily-2dpp` | 183 |
| Semanal horizontal | `weekly` | 53 |

O miolo usa A5 retrato, português e margens espelhadas. O semanal agrupa os dias de segunda a domingo, com as datas fora do ano em branco. No layout de dois dias, a última página de um ano comum usa a largura inteira para 31 de dezembro. O escopo atual é o miolo datado, sem feriados, módulos extras ou imposição gráfica.

## Usar pelo Astro SSR

A rota `POST /admin/agenda-classica.pdf?ano=2027&layout=weekly` usa a autenticação existente de `/admin`. Para testar localmente, configure as credenciais administrativas no servidor e faça a requisição abaixo.

```sh
curl --user "$ADMIN_USERNAME" -X POST \
  'http://127.0.0.1:4321/admin/agenda-classica.pdf?ano=2027&layout=weekly' \
  -o agenda-classica.pdf
```

O servidor Node inicia o Typst como subprocesso e devolve o PDF diretamente. A rota aceita um ano entre 1900 e 9998 e processa uma geração por vez. O gerador é independente do SQLite e dos volumes de dados e uploads.

## Testar em Docker

O build usa o binário oficial do Typst fixado por versão e SHA-256 para `linux/amd64` e `linux/arm64`. A etapa de teste e build da aplicação roda sem rede após a instalação das dependências. A imagem final leva o binário, os avisos de licença e os recursos da agenda.

```sh
docker buildx build --platform linux/amd64,linux/arm64 .
docker run --rm --network none 678estudio-agenda-poc:local \
  node src/server/agenda/poc.mjs 2027 /tmp/agenda
```

Para executar a segunda linha, primeiro carregue uma imagem da arquitetura local com `docker buildx build --load -t 678estudio-agenda-poc:local .`. Para copiar a saída, mantenha o contêiner com `--name agenda-poc` no lugar de `--rm` e execute `docker cp agenda-poc:/tmp/agenda ./output/pdf/agenda-classica`.

`npm test` valida parâmetros, upload, concorrência e autenticação. Defina `AGENDA_TYPST_TEST=1` para incluir a compilação real, os nove pares de layout e estilo, casos bissextos e a comparação pixel a pixel entre prévia personalizada e a página correspondente do miolo completo. O Docker ativa essa opção automaticamente.

## Incorporar outro template

- `src/server/agenda/classic.mjs` valida a configuração e executa o compilador. A rota SSR e `poc.mjs` compartilham esse módulo.
- `typst/classic.typ` define o calendário e a paginação. `typst/lib/` reúne as grades compartilhadas e os trechos Clássico, Comercial e Feminino, incluindo a faixa pontilhada comercial e a tipografia manuscrita do Feminino. [Commit de referência dos templates](https://github.com/mlacunha/agenda-pdf-saas/tree/5491117468f2252fe36835fdd3c85daad5dd07ad/app/templates/typst)
- `options.mjs` reúne as opções publicadas e seus rótulos para o formulário e para a validação no servidor.
- Para acrescentar um modelo, inclua seu ponto de entrada Typst e apenas os imports e recursos necessários. Mantenha fontes e respectivas licenças em `typst/fonts/`, registre o modelo nas opções aceitas pelo backend e inclua um caso de compilação e paginação nos testes.

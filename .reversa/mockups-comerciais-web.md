# Mockups de Canecas no administrativo

O módulo reaproveita os PSDs comerciais 3, 9, 10 e 11 e os contratos de posicionamento do gerador original. O original usa Sharp para preparar cada arte, Chromium para hospedar o Photopea e scripts para substituir o conteúdo dos objetos inteligentes. O Photoshop/Photopea aplica as transformações, máscaras, grupos, reflexos e iluminação. O instalador e o launcher são específicos de Windows. O processamento original pode ser adaptado para Chromium Linux, mas manteria a inicialização do navegador e o acesso ao Photopea em cada geração.

A aplicação web usa recursos pré-processados em vez de abrir PSDs. A preparação captura a cena com os slots preenchidos de preto, mede a resposta tonal em cada slot e usa rampas e sinais de fase para recuperar as coordenadas inversas da deformação. O renderizador usa o mesmo preparo de arte do motor original, amostra a imagem em cada slot e aplica as curvas de iluminação e máscara ao pixel de base. A saída mantém dimensões, densidade e perfil de cor do original, incluindo Adobe RGB no modelo 11. O cálculo deriva de amostras e pode produzir pequenas diferenças, sobretudo nas bordas interpoladas da arte.

| PSD | PNG de saída |
| --- | --- |
| 3 | 3000 × 2500, 72 dpi |
| 9 | 1000 × 1000, 200 dpi |
| 10 | 1000 × 1000, 200 dpi |
| 11 | 1920 × 1920, 72 dpi, Adobe RGB |

Os recursos de produção ficam em `src/server/mockups/templates` e entram na imagem existente pelo Dockerfile. O endpoint abaixo de `/admin/mockups-comerciais` usa a autenticação e a verificação de origem do painel. Cada requisição gera um PNG em memória. A interface reúne os resultados temporariamente no navegador para os downloads individuais e o ZIP. O serviço limita o tamanho e a resolução da arte e processa um modelo por vez.

## Recalibrar os recursos

A manutenção dos recursos exige os PSDs originais em `data/mockups-comerciais/originais`, o ambiente do gerador original com Chromium e acesso ao Photopea e Python com Pillow e NumPy. A geração comercial no Astro usa os arquivos versionados.

1. Na raiz do projeto, rode `node tools/mockup-commercial-poc/capture-web-plates.mjs .reversa/mockup-probes 3 9 10 11`.
2. Execute o mesmo comando com `MOCKUP_PHASE_ONLY=1` para capturar as coordenadas de maior precisão.
3. Rode `python -B tools/mockup-commercial-poc/pack-web-plates.py .reversa/mockup-probes src/server/mockups/templates 3 9 10 11`.
4. Compare o resultado web com um PNG novo do gerador original, usando a mesma arte e o enquadramento do template.

# Enquadramento dos mockups comerciais

O motor anterior ajustava a imagem diretamente no espaço de cada objeto inteligente. Os modelos 3, 9 e 10 usam objetos de caneca de 2301 × 2310 px em modo conter. O 11 usa 738 × 665 px em modo preencher e âncoras esquerda, centro e direita. Retratos cabiam em faixas estreitas no primeiro conjunto e eram recortados no segundo. Os limites visíveis dos mapas e a escala fotográfica de cada caneca também alteram a ocupação aparente. A faixa de 680 × 283 px do modelo 9 e os papéis de 1607 × 724 px do modelo 11 são superfícies distintas.

## Transformação

O perfil personalizado encaixa a arte numa área lógica de 20 × 9, que o adaptador inscreve no espaço nativo de cada slot de caneca usando um único fator. A prévia plana do editor usa o mesmo cálculo, com âncora central. Os mapas nativos continuam responsáveis pela perspectiva, iluminação e curvatura.

- Conter usa o menor dos fatores entre área útil e arte. Preencher usa o maior. Manual mantém o último modo de encaixe e os ajustes correntes.
- Os fatores de zoom global, individual e nativo são multiplicados. Os deslocamentos global e individual são somados em porcentagem da área útil. O ajuste individual de zoom atua sobre a escala da arte sem multiplicar o deslocamento global.
- O adaptador conserva a posição da área dentro do slot e distribui o excedente da arte de acordo com a âncora nativa. Por isso, canecas da mesma cena compartilham os ajustes, mas podem mostrar partes distintas de uma arte com corte.
- A preparação recorta a interseção visível no espaço da arte antes do redimensionamento. Assim, mesmo com zoom composto elevado, o buffer intermediário fica limitado ao tamanho do slot. Áreas descobertas são brancas. A faixa e os papéis usam o preparo original e ficam imunes a ajustes de caneca.
- Ajuste original restaura as calibrações de todos os slots e zera as correções do trabalho. Sem o novo parâmetro na API, a geração segue o mesmo caminho anterior.

A interface mantém o estado por ID de modelo enquanto a página permanece aberta. A prévia é o PNG de produção. Para atualizar, apenas modelos selecionados cujo enquadramento diverge do resultado disponível são renderizados. Uma renderização individual não altera os outros modelos. Arquivos de prévia desatualizados ficam indisponíveis para download, e o ZIP só é habilitado quando todos os modelos selecionados estiverem atualizados. Os mapas descompactados continuam sendo processados em sequência, sem cache persistente ou retenção em memória entre trabalhos.

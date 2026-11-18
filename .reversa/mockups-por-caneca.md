# Ajustes por caneca

O card mantém os controles globais e por modelo. Em **Ajustar canecas**, o seletor e os marcadores apontam para IDs estáveis dos manifests. Cada caneca conserva zoom e deslocamentos próprios. Centralizar zera somente os deslocamentos da caneca selecionada, enquanto Restaurar zera também o zoom. Arrastar o marcador ou usar as setas modifica o ajuste em espera. Atualizar prévia renderiza somente a cena daquele card.

Em modo personalizado, o zoom da caneca multiplica o zoom global e o zoom do modelo. Os deslocamentos são somados em relação à área de composição. No modo original, uma correção de caneca usa o encaixe e a âncora de seu próprio slot, e os demais slots continuam no caminho original. Um ajuste neutro é ignorado. A faixa e os papéis têm política própria e não aceitam IDs de ajuste na API.

Os PNGs são a saída nativa do Astro e mantêm DPI e perfil ICC. A opção global de exportação aplica-se ao download individual e ao ZIP. JPEG e WebP são codificados no navegador a partir do PNG aprovado e mantêm as dimensões da prévia. São formatos de conveniência para web, com compressão com perdas e gerenciamento de cor pelo navegador. A exportação PNG conserva os metadados nativos e usa os mesmos bytes da prévia.

Os recursos calibrados continuam empacotados na imagem existente. Nenhum mapa de composição foi recalibrado.

# Investigation: Sistema Compartilhado de Capas Personalizadas

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`
> Contexto: `_reversa_sdd/architecture.md` e `_reversa_sdd/domain.md`

## 1. Pesquisa de Fundo e Panorama da Papelaria

A produção gráfica de capas para encadernação em espiral ou Wire-O de papelaria personalizada (Agendas, Planners e Cadernos A5) possui requisitos físicos e operacionais distintos do miolo interno:

1. **Formato Refilado vs. Sangria Física:**
   - O formato final de uma capa A5 é de `148 × 210 mm`.
   - Na etapa de laminação (bopp fosco/brilho) e refile em guilhotina gráfica, oscilações mecânicas de 1 a 2 mm são comuns. Por isso, a impressão deve estender fundos, ilustrações e fotos além da borda útil: a **sangria (bleed)** de `3 mm` (bruto `154 × 216 mm`) ou `5 mm` (bruto `158 × 220 mm`) elimina riscos de filetes brancos após o corte.
2. **Zona de Segurança e Margem de Furação Wire-O:**
   - Em encadernações em Wire-O passo 2:1 ou 3:1, a furação perfura entre `8 mm` e `10 mm` a partir da borda esquerda na capa frontal (e borda direita na contracapa).
   - Elementos críticos (letras, nomes, detalhes do rosto em fotos) exigem uma **margem de segurança (live area)** de pelo menos `15 mm` em relação à borda da furação e `8 mm` nas demais bordas.
3. **Imposição em Folha A4 vs. Folhas A5:**
   - Impressoras gráficas para sublimação ou papéis fotográficos adesivos (utilizados no empastamento de capas) frequentemente trabalham com folhas no formato A4 (`297 × 210 mm`).
   - **Restrição Geométrica Crítica:** Duas capas A5 refiladas (`148 + 148 = 296 mm`) somam quase a largura total da folha A4 (`297 mm`), restando apenas `1 mm` de margem física total. Se adicionarmos 3 mm ou 5 mm de sangria em cada lado, a largura combinada excederia a folha A4.
   - **Solução de Engenharia Adotada:**
     - Quando impressas em A4 horizontal lado a lado para corte ao meio (sem dobras), a montagem utiliza o formato refilado com margens internas e uma linha guia de corte central milimétrica de 1 ponto, ou sangria adaptada às margens imprimíveis reais da impressora, garantindo escala 1:1 sem distorção.
     - Quando impressas com sangria integral (3 mm ou 5 mm), o operador utiliza os arquivos individuais em A5 para alimentação de mídias A5 ou impressão em folhas SRA4/A3.

## 2. Padrões Arquiteturais e Reutilização

1. **Módulo Centralizado `src/server/cover/`:**
   - Criação de catálogo de estilos (`src/server/cover/options.mjs`) exportando estilos (`classic`, `modern`, `photographic`), tipografias (`modern`, `geometric`, `editorial`), paletas homologadas e regras de sangria.
   - Contratos tipados em `src/server/cover/coverConfig.ts` para serialização de dados no banco e nos personalizadores.
2. **Motor Gráfico Typst (`src/server/cover/typst/`):**
   - Criação de templates Typst dedicados para renderização vetorial das capas:
     - `classic.typ`: Molduras clássicas com cantos ornamentados, tipografia com serifas ou caixa alta espaçada.
     - `modern.typ`: Elementos gráficos contemporâneos, faixas de cor assimétricas e tipografia geométrica.
     - `photographic.typ`: Máscara proporcional de foto com ajuste de enquadramento (offset X/Y e zoom), overlay de proteção para contraste de texto e chancela discreta.
     - `cover.typ`: Entrypoint parametrizável aceitando flags CLI (`--input target=front|back|combined-a4`, `--input bleed=3mm|5mm`).
3. **Isolamento Completo da Imposição Cut & Stack:**
   - O módulo `src/server/print/a4Imposition.ts` gerencia especificamente pilhas de miolo (dezenas a centenas de páginas agrupadas para guilhotina).
   - O motor de capas opera estritamente com `1 capa` e `1 contracapa`, eliminando complexidade e garantindo independência total.

## 3. Alternativas Avaliadas

| Alternativa | Vantagens | Desvantagens | Decisão |
|-------------|-----------|--------------|---------|
| **1. Editor gráfico interativo Canvas/Konva/Fabric.js** | Liberdade total de camadas e arrastar elementos para o cliente. | Complexidade operacional extrema, incompatibilidade com templates vetoriais Typst, risco elevado de erros de impressão e textos fora da margem de corte. | **Descartada 🔴** |
| **2. Gerar capas em HTML/Puppeteer no servidor** | Renderização idêntica ao DOM do navegador. | Alto consumo de memória e CPU no contêiner Node.js, tempo de compilação lento, menor precisão dimensional gráfica. | **Descartada 🔴** |
| **3. Templates Typst Modulares Parametrizados com Astro SSR e Prévia Canvas/PNG** | Precisão dimensional absoluta em pontos/milímetros, renderização vetorial nativa, geração sub-segundo, compatibilidade total com arquitetura atual. | Requer desenhar e codificar as variantes em Typst e espelhar regras na prévia do cliente. | **Aprovada 🟢** |


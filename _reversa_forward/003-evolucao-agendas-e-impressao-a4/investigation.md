# Investigation: Evolução Editorial das Agendas e Módulo Compartilhado de Impressão A4

> Identificador: `003-evolucao-agendas-e-impressao-a4`
> Data: `2026-11-11`

## 1. Análise do Miolo Atual das Agendas e Regra de Semanas entre Meses

### 1.1. Regra Determinística de Semanas entre Meses (`weekly`)
No layout semanal (`weekly`), cada página exibe uma semana completa de **segunda-feira a domingo** (7 linhas horizontais).
- Uma semana que atravessa a fronteira entre dois meses (por exemplo, segunda-feira `25/01/2027` a domingo `31/01/2027`, ou segunda-feira `28/01/2028` a domingo `03/02/2028`) **nunca deve ser duplicada**.
- **Regra de atribuição ao mês:** Cada semana $w$ (iniciando no deslocamento `offset` em relação a `01/jan`) possui como primeira data válida dentro do ano `first_in_year = date-at(calc.max(offset, 0))`. A semana pertence exclusivamente ao mês `first_in_year.month()`.
- **Consequência editorial:**
  1. Todas as 53 semanas que cobrem de `01/jan` a `31/dez` aparecem **exatamente uma vez** em ordem cronológica contínua.
  2. Ao encerrar as semanas atribuídas ao mês $m$, é inserida imediatamente a página `monthly-finance` do mês $m$, seguida pela abertura `monthly-plan` do mês $m + 1$.

### 1.2. Isolamento Mensal no Layout `daily-2dpp`
No layout de dois dias por página (`daily-2dpp`), cada mês $m$ possui $D_m \in \{28, 29, 30, 31\}$ dias:
- Os dias do mês $m$ são paginados em pares `(dia 1, dia 2), (dia 3, dia 4), ...`.
- Quando $D_m$ é par (abril, junho, setembro, novembro com 30 dias, e fevereiro comum com 28 dias), o mês gera exatamente $D_m / 2$ páginas completas.
- Quando $D_m$ é ímpar (janeiro, março, maio, julho, agosto, outubro, dezembro com 31 dias, e fevereiro bissexto com 29 dias), a última página diária do mês ($\lceil D_m / 2 \rceil$) exibe o último dia do mês na coluna esquerda e um painel estruturado **"Notas e Pendências do Mês"** na coluna direita.
- Com isso:
  - Ano comum (2027): $7 \times 16 + 4 \times 15 + 14 = 186$ páginas diárias.
  - Ano bissexto (2028): $7 \times 16 + 4 \times 15 + 15 = 187$ páginas diárias.

### 1.3. Fechamento Par de Páginas A5
Para que a última página (Página Institucional do **678 Estudio**) caia sempre no verso da última folha A5 (ou que o documento tenha um número par $N$ de páginas A5, evitando folha avulsa sem verso definido):
- Antes das 2 páginas finais fixas (`Calendário do Ano Seguinte` e `Página Institucional`), a quantidade de páginas de `Anotações` é ajustada automaticamente:
  - Em `daily-1dpp`: `2` páginas de Anotações em ano comum (365 dias → total **400 páginas A5**) e `1` página de Anotações em ano bissexto (366 dias → total **400 páginas A5**).
  - Em `daily-2dpp`: `3` páginas de Anotações em ano comum (186 págs. diárias → total **222 páginas A5**) e `2` páginas de Anotações em ano bissexto (187 págs. diárias → total **222 páginas A5**).
  - Em `weekly`: `4` páginas de Anotações (53 págs. semanais → total **90 páginas A5** em 2027 e 2028).
- Note a vantagem operacional: **independentemente de o ano ser comum ou bissexto**, a Agenda terá sempre exatamente:
  - **`daily-1dpp`:** **400 páginas A5** (200 folhas A5 = 100 folhas A4).
  - **`daily-2dpp`:** **222 páginas A5** (111 folhas A5 = 56 folhas A4).
  - **`weekly`:** **90 páginas A5** (45 folhas A5 = 23 folhas A4).

---

## 2. Matemática de Imposição A4 (Cut & Stack e Correspondência Frente/Verso)

### 2.1. Definições Geométricas
- **Página A5 Retrato:** largura $W_{A5} = 148,5\text{ mm} = 420,945\text{ pt}$, altura $H_{A5} = 210\text{ mm} = 595,276\text{ pt}$.
- **Folha A4 Paisagem:** largura $W_{A4} = 297\text{ mm} = 841,89\text{ pt} = 2 \times W_{A5}$, altura $H_{A4} = 210\text{ mm} = 595,276\text{ pt} = H_{A5}$.
- **Metade Esquerda da Folha A4:** intervalo $x \in [0, W_{A5}]$.
- **Metade Direita da Folha A4:** intervalo $x \in [W_{A5}, 2 W_{A5}]$.
- **Linha de Corte Central:** $x = W_{A5} = 148,5\text{ mm}$.

### 2.2. Mapeamento de Folhas A5 para Folhas A4 (Cut & Stack vs. Sequencial)
Dado um PDF A5 com $N$ páginas (1-indexadas $1 \dots N$):
- O documento possui $L = \lceil N / 2 \rceil$ **folhas A5 físicas**.
- Para cada folha A5 $k \in \{0 \dots L-1\}$ (0-indexada):
  - `frontPageIndex` $= 2k$ (página humana $2k + 1$, ímpar).
  - `backPageIndex` $= 2k + 1$ se $2k + 1 < N$, caso contrário `null` (em branco).
- O lote A4 possui $S = \lceil L / 2 \rceil$ **folhas A4 físicas**.
- Para cada folha A4 $s \in \{0 \dots S-1\}$:
  - No modo **`cut-stack` (padrão aprovado):**
    - `leftLeaf` $= s$
    - `rightLeaf` $= s + S$ (se $s + S < L$, caso contrário `null`)
  - No modo **`sequential`:**
    - `leftLeaf` $= 2s$
    - `rightLeaf` $= 2s + 1$ (se $2s + 1 < L$, caso contrário `null`)

### 2.3. Posicionamento na Frente e no Verso da Folha A4
1. **Na Frente da Folha A4 $s$:**
   - **Slot Esquerdo ($x = 0$):** recebe `leftLeaf.frontPageIndex` com rotação `0°`.
   - **Slot Direito ($x = W_{A5}$):** recebe `rightLeaf.frontPageIndex` com rotação `0°`.
2. **No Verso da Folha A4 $s$:**
   - **Caso `flipMode = 'short-edge'` (virar folha da esquerda para a direita mantendo o mesmo topo):**
     - Ao virar a folha A4 horizontalmente como página de livro, a metade que estava na **esquerda da frente** passa a ficar na **direita do verso**, e a metade que estava na **direita da frente** passa a ficar na **esquerda do verso**.
     - Portanto:
       - **Slot Esquerdo ($x = 0$):** recebe `rightLeaf.backPageIndex` com rotação `0°`.
       - **Slot Direito ($x = W_{A5}$):** recebe `leftLeaf.backPageIndex` com rotação `0°`.
   - **Caso `flipMode = 'long-edge'` (virar folha de cima para baixo invertendo o topo):**
     - Ao tombar a folha A4 verticalmente, a metade esquerda continua na esquerda e a metade direita continua na direita, porém a folha fica de cabeça para baixo em relação à alimentação da frente.
     - Portanto:
       - **Slot Esquerdo ($x = 0$):** recebe `leftLeaf.backPageIndex` rotacionada em `180°` (ancorada em $x = W_{A5}, y = H_{A5}$).
       - **Slot Direito ($x = W_{A5}$):** recebe `rightLeaf.backPageIndex` rotacionada em `180°` (ancorada em $x = 2W_{A5}, y = H_{A5}$).
3. **Ordem das Páginas no PDF A4 de Versos (`versoOrder`):**
   - `normal`: emite os versos na ordem das folhas A4 $s = 0, 1, \dots, S-1$.
   - `reverse`: emite os versos na ordem inversa $s = S-1, S-2, \dots, 0$ (para impressoras cuja bandeja de saída entrega as frentes com a face para cima, deixando a última folha no topo da pilha recolocada).

### 2.4. Compensação de Área Imprimível (`scaleMode`: `100%` vs `safe-96%`)
Impressoras jato de tinta e laser A4 comuns frequentemente possuem margens físicas não imprimíveis de `3 mm` a `5 mm` nas quatro bordas da folha A4.
- Embora os templates A5 de Agenda e Planner já possuam margens internas (`10 mm` a `18 mm`), a opção **`scaleMode = 'safe'` (`96%`)** aplica escala uniforme $k = 0,96$ centralizada dentro de cada metade A5 (`offsetX = W_A5 * (1 - k) / 2 ≈ 2,97 mm`, `offsetY = H_A5 * (1 - k) / 2 ≈ 4,20 mm`), garantindo folga extra nas bordas externas e junto à linha de corte central de `148,5 mm`, sem distorcer proporções nem deslocar o corte central.


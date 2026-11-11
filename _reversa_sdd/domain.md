# Modelo de Domínio e Glossário de Negócio — 678 Estudio

Documento consolidado gerado na Fase de Interpretação pelo Detective.

---

## 1. Glossário de Domínio

| Termo | Significado no Negócio | Contexto / Módulo | Nível de Certeza |
|---|---|---|---|
| **Sublimação Térmica** | Processo gráfico de transferência de tintas sublimáticas sob calor e pressão para cerâmica e pranchas de madeira tratada. | Produção / Estúdio | 🟢 CONFIRMADO |
| **Caneca 325ml** | Caneca padrão de cerâmica branca resinada (11 oz). Área útil cilíndrica de 9 cm de altura e larguras variáveis de 20, 21 e 22 cm. | `customizer-caneca-3d` | 🟢 CONFIRMADO |
| **Quadro em Madeira Clara** | Peça de decoração com arte sublimada diretamente em placa de madeira de 30 × 40 cm, envolvida por moldura de cor personalizável. | `customizer-quadro-ambiente` | 🟢 CONFIRMADO |
| **Passe-partout / Margem de Madeira** | Espaçamento visível da madeira clara entre a arte central e a moldura, ajustável de 0.5 a 8 cm. | `customizer-quadro-ambiente` | 🟢 CONFIRMADO |
| **Mockup de Prévia** | Composição visual (imagem plana ou render 3D) exportada como imagem e salva com identificador único para orçamento. | `mockup` / `api` | 🟢 CONFIRMADO |
| **Agenda Clássica** | Produto de papelaria institucional diagramado no motor Typst com 3 layouts (1 dia por página, 2 dias por página, semanal) e 3 estilos visuais. | `agenda-compiler` | 🟢 CONFIRMADO |
| **Orçamento Rápido via WhatsApp** | Fluxo de checkout informal em que a prévia e especificações da peça são formatadas e enviadas ao canal de atendimento do estúdio. | Todos os customizadores | 🟢 CONFIRMADO |
| **Produto Provisório (`is_provisional`)** | Item de catálogo exibido temporariamente com mockups ou imagens preliminares até a produção fotográfica final em estúdio. | `catalog` / `admin` | 🟢 CONFIRMADO |
| **Trabalho Entregue (`gallery_works`)** | Objeto de portfólio real contendo fotografias reais de peças customizadas já entregues aos clientes com vínculo ao Instagram. | `admin` / `gallery` | 🟢 CONFIRMADO |

---

## 2. Regras de Domínio e Negócio

### 2.1 Catálogo e Vitrine
- **RN-CAT-01 (Visibilidade Pública)**: Apenas produtos com `is_active = 1` e categorias com `is_active = 1` são visíveis aos clientes no catálogo público. 🟢 CONFIRMADO
- **RN-CAT-02 (Ordenação Comercial)**: Produtos dentro de uma mesma categoria respeitam a ordenação explícita de `display_order ASC`. Itens criados sem ordenação definida recebem `display_order = 99` por padrão. 🟢 CONFIRMADO
- **RN-CAT-03 (Exclusividade de Categoria)**: Cada produto pertence a exatamente uma categoria válida (`quadros`, `canecas`, `papelaria` ou `artesanato`). 🟢 CONFIRMADO

### 2.2 Personalizador de Canecas
- **RN-CAN-01 (Área de Impressão Cilíndrica)**: A caneca suporta apenas as larguras de estampa de 20 cm, 21 cm (padrão) e 22 cm, sempre fixadas em 9 cm de altura. 🟢 CONFIRMADO
- **RN-CAN-02 (Zona Morta da Alça)**: A alça da caneca localiza-se na coordenada angular de 90° ($\pi/2$). A estampa nunca cobre a alça; a folga restante do perímetro é centralizada ao redor da alça. 🟢 CONFIRMADO
- **RN-CAN-03 (Cálculo de Deslocamento)**: O ajuste de posicionamento manual da arte é limitado horizontalmente entre -800 e +800 pixels e verticalmente entre -350 e +350 pixels no mapa planificado. 🟢 CONFIRMADO

### 2.3 Personalizador de Quadros
- **RN-QUA-01 (Dimensão Base)**: O quadro opera na proporção áurea de 30 × 40 cm. Ao alternar para o modo Paisagem, a largura torna-se 40 cm e a altura 30 cm. 🟢 CONFIRMADO
- **RN-QUA-02 (Margens Mínima e Máxima)**: As margens de madeira clara entre a estampa e a moldura devem ser estritamente entre 0.5 cm e 8 cm por lado, com incremento de 0.5 cm. 🟢 CONFIRMADO
- **RN-QUA-03 (Molduras Homologadas)**: São permitidas apenas molduras nas cores: Preta (`#121316`), Branca (`#f1eee8`) e Marrom (`#583a2c`). 🟢 CONFIRMADO
- **RN-QUA-04 (Escala de Zoom)**: O zoom da fotografia enviada pelo usuário é limitado entre 50% e 250% da área da prancha. 🟢 CONFIRMADO

### 2.4 Motor de Agendas (Typst)
- **RN-AGE-01 (Validação Temporal)**: O ano de compilação da agenda deve ser um valor inteiro válido entre 1900 e 9998. 🟢 CONFIRMADO
- **RN-AGE-02 (Acessibilidade de Cor e Contraste)**: Cores personalizadas escolhidas pelo cliente passam por cálculo de luminância relativa; o contraste com o fundo branco deve ser no mínimo 3:1 (critério WCAG 2.1 AA para elementos gráficos). 🟢 CONFIRMADO
- **RN-AGE-03 (Rascunho e Chave de Orçamento)**: Uma solicitação de agenda salva no banco de dados gera um `draft_token` exclusivo e permanece em status `requested` com retenção de até 8 prévias em formato PNG e o logotipo original em BLOB. 🟢 CONFIRMADO

### 2.5 Configurações do Estúdio
- **RN-CFG-01 (Identidade Única)**: O registro de configurações do estúdio é estritamente uma linha única no banco (`id = 1`). 🟢 CONFIRMADO
- **RN-CFG-02 (Normalização de Contatos)**: Números de telefone inseridos são formatados e validados no formato E.164 com código do Brasil (`+55`). Links de redes sociais devem obrigatoriamente utilizar protocolo HTTPS e apontar exclusivamente para domínios de perfil de `instagram.com` e `facebook.com`. 🟢 CONFIRMADO


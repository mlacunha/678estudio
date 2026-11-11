/**
 * Reversa Docs — Repositório central de dados offline (file:// compatible)
 */
window.RV_DATA = {
  project: {
    name: "678 Estudio",
    generatedAt: "2026-11-11T18:25:00Z",
    confidenceScore: 90.6,
    totalModules: 7,
    totalLoc: 3840,
    primaryTech: "Astro 4.16 + Node.js (Hybrid SSR)"
  },
  modules: [
    { "id": "catalog", "name": "Catálogo & Produtos", "loc": 315, "files": 6, "complexity": "Baixa", "confidence": "96.4%" },
    { "id": "database", "name": "Banco SQLite (@libsql/client)", "loc": 235, "files": 2, "complexity": "Média", "confidence": "95.8%" },
    { "id": "customizer-caneca-3d", "name": "Caneca 3D (Three.js)", "loc": 610, "files": 4, "complexity": "Média", "confidence": "95.5%" },
    { "id": "customizer-quadro-ambiente", "name": "Quadro Ambiente (Canvas 2D)", "loc": 645, "files": 4, "complexity": "Média", "confidence": "95.0%" },
    { "id": "agenda-compiler", "name": "Compilador Typst CLI", "loc": 480, "files": 7, "complexity": "Alta", "confidence": "84.6%" },
    { "id": "admin", "name": "Painel Administrativo", "loc": 820, "files": 12, "complexity": "Média", "confidence": "77.8%" },
    { "id": "public-site", "name": "Site Público Vitrine", "loc": 735, "files": 10, "complexity": "Baixa", "confidence": "83.3%" }
  ],
  deps: {
    nodes: [
      { "id": "catalog", "label": "Catálogo", "group": "core" },
      { "id": "database", "label": "Banco de Dados", "group": "infra" },
      { "id": "customizer-caneca-3d", "label": "Caneca 3D", "group": "feature" },
      { "id": "customizer-quadro-ambiente", "label": "Quadro Ambiente", "group": "feature" },
      { "id": "agenda-compiler", "label": "Compilador Typst", "group": "compiler" },
      { "id": "admin", "label": "Painel Admin", "group": "admin" },
      { "id": "public-site", "label": "Site Público", "group": "ui" }
    ],
    edges: [
      { "source": "catalog", "target": "database", "type": "imports" },
      { "source": "customizer-caneca-3d", "target": "catalog", "type": "uses" },
      { "source": "customizer-caneca-3d", "target": "database", "type": "persists" },
      { "source": "customizer-quadro-ambiente", "target": "catalog", "type": "uses" },
      { "source": "agenda-compiler", "target": "database", "type": "persists" },
      { "source": "admin", "target": "catalog", "type": "manages" },
      { "source": "admin", "target": "database", "type": "manages" },
      { "source": "public-site", "target": "catalog", "type": "renders" }
    ]
  },
  glossary: [
    { "term": "Sublimação Térmica", "def": "Processo de transferência de tintas sublimáticas sob calor e pressão para cerâmica e pranchas de madeira tratada.", "module": "Geral" },
    { "term": "Caneca 325ml", "def": "Caneca de cerâmica branca resinada (11 oz) com área cilíndrica de 9 cm de altura e larguras de 20, 21 e 22 cm.", "module": "Caneca 3D" },
    { "term": "Quadro em Madeira Clara", "def": "Peça de 30 × 40 cm com arte estampada sobre madeira clara com passe-partout e moldura personalizável.", "module": "Quadro Ambiente" },
    { "term": "Passe-partout / Margem", "def": "Espaçamento visível da madeira clara entre a arte central e a moldura, ajustável de 0.5 a 8 cm.", "module": "Quadro Ambiente" },
    { "term": "Mockup de Prévia", "def": "Composição gráfica ou snapshot 3D exportado com identificador único salvo em disco para orçamentos.", "module": "API / Mockup" },
    { "term": "Agenda Clássica", "def": "Produto de papelaria institucional diagramado no motor Typst com 3 layouts e validação WCAG de cores.", "module": "Typst Compiler" },
    { "term": "Orçamento via WhatsApp", "def": "Funil de fechamento consultivo onde a prévia gerada é enviada diretamente ao canal de atendimento.", "module": "Conversão" },
    { "term": "is_provisional", "def": "Flag de produto provisório que exibe mockups até a produção das fotos finais em estúdio.", "module": "Catálogo" }
  ]
};


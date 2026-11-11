#import "lib/planner-sections.typ": (
  section-abertura,
  section-anual,
  section-anual-metas,
  section-mensal,
  section-semanal-left,
  section-semanal-right,
  section-habitos,
  section-financeiro,
  section-financeiro-left,
  section-financeiro-right,
  section-revisao,
  section-anotacoes,
)

#let raw-year = sys.inputs.at("year", default: "2027")
#let year = if raw-year != "" and raw-year != "none" { int(raw-year) } else { 2027 }
#let mode = sys.inputs.at("mode", default: "dated")
#let style-id = sys.inputs.at("style", default: "classic")
#let typo-id = sys.inputs.at("typography", default: "modern")
#let personalization-name = sys.inputs.at("personalization_name", default: "")
#let single-section = sys.inputs.at("section", default: "all")

#let has-logo = "logo" in sys.inputs
#let has-watermark = "watermark" in sys.inputs and has-logo

#let primary = rgb(sys.inputs.at("primary", default: "#1f2937"))
#let secondary = rgb(sys.inputs.at("secondary", default: "#2563eb"))
#let accent = rgb(sys.inputs.at("accent", default: "#cca032"))

#let (font-body, font-heading) = if typo-id == "geometric" {
  ("Manrope", "Manrope")
} else if typo-id == "editorial" {
  (("DM Sans 9pt", "DM Sans"), "DM Serif Display")
} else {
  ("Inter", "Inter")
}

#let colors = (
  primary: primary,
  secondary: secondary,
  accent: accent,
  lines: color.mix((white, 75%), (secondary, 25%)),
  bodyFont: font-body,
  headingFont: font-heading,
)

#let watermark-bg = if has-watermark [
  #place(center + horizon, rotate(-22deg, image("logo.png", width: 62mm, height: 62mm, fit: "contain")))
  #place(top + left, rect(width: 100%, height: 100%, fill: white.transparentize(12%), stroke: none))
] else { none }

#set document(title: "Planner Essencial", author: "678 Estudio")
#set text(lang: "pt", region: "BR", font: font-body, size: 9pt, fill: colors.primary)
#set page(
  paper: "a5",
  margin: (top: 15mm, bottom: 15mm, inside: 20mm, outside: 12mm),
  background: if single-section == "abertura" or single-section == "all" { none } else { watermark-bg },
  footer: context grid(
    columns: (1fr, auto), align: horizon,
    if has-logo and counter(page).get().first() > 1 {
      grid(columns: (auto, auto), column-gutter: 5pt, align: horizon,
        image("logo.png", width: 18mm, height: 4.5mm, fit: "contain"),
        text(size: 6.5pt, fill: colors.secondary)[· Planner Essencial · 678 Estudio]
      )
    } else {
      text(size: 7pt, fill: colors.secondary)[Planner Essencial · 678 Estudio]
    },
    text(size: 7pt, fill: colors.primary)[#counter(page).display()],
  ),
)

#let data-file = if mode == "dated" {
  "data/weeks-" + str(year) + ".json"
} else {
  "data/weeks-undated.json"
}
#let planner-data = json(data-file)

// Renderização Direcionada por Seção (para Prévias Rápidas em <200ms) ou Completa
#if single-section == "abertura" [
  #section-abertura(colors, personalizationName: personalization-name, year: year, mode: mode, hasLogo: has-logo)
] else if single-section == "anual" [
  #section-anual(colors, year: year, mode: mode)
] else if single-section == "mensal" [
  #section-mensal("Janeiro", colors, year: year, mode: mode)
] else if single-section == "semanal" [
  #let sample-week = planner-data.months.at(0).weeks.at(0)
  #section-semanal-left(colors, weekInfo: sample-week, monthName: "Janeiro")
  #pagebreak()
  #section-semanal-right(colors, weekInfo: sample-week, monthName: "Janeiro")
] else if single-section == "habitos" [
  #section-habitos("Janeiro", colors, mode: mode)
] else if single-section == "financeiro" [
  #section-financeiro("Janeiro", colors, mode: mode)
] else if single-section == "revisao" [
  #section-revisao("Janeiro", colors, mode: mode)
] else if single-section == "anotacoes" [
  #section-anotacoes(colors)
] else [
  // Documento Completo: Sequência Editorial com Paridade Rigorosa

  // Página 1 (Ímpar / Frente / Direita): Abertura e Identificação (com logo principal em destaque)
  #section-abertura(colors, personalizationName: personalization-name, year: year, mode: mode, hasLogo: has-logo)
  #pagebreak()

  // Ativa a marca-d'água (quando selecionada) para todas as páginas do miolo a partir da Página 2
  #set page(background: watermark-bg)

  // Página 2 (Par / Verso / Esquerda): Planejamento Anual
  #section-anual(colors, year: year, mode: mode)
  #pagebreak()

  // Página 3 (Ímpar / Frente / Direita): Metas Estratégicas Anuais
  #section-anual-metas(colors, year: year, mode: mode)
  #pagebreak()

  // 12 Ciclos Mensais
  #for month-data in planner-data.months [
    // Spread 1: Planejamento Mensal (Esq / Par) + Hábitos (Dir / Ímpar)
    #section-mensal(month-data.monthName, colors, year: year, mode: mode)
    #pagebreak()
    #section-habitos(month-data.monthName, colors, mode: mode)
    #pagebreak()

    // Spread 2: Controle Financeiro Duplo (Esq / Par: Receitas/Fixas; Dir / Ímpar: Variáveis/Metas)
    #section-financeiro-left(month-data.monthName, colors, mode: mode)
    #pagebreak()
    #section-financeiro-right(month-data.monthName, colors, mode: mode)
    #pagebreak()

    // Semanas do Mês: cada semana em duas páginas consecutivas A5 (Esq / Par + Dir / Ímpar)
    #for w in month-data.weeks [
      #section-semanal-left(colors, weekInfo: w, monthName: month-data.monthName)
      #pagebreak()
      #section-semanal-right(colors, weekInfo: w, monthName: month-data.monthName)
      #pagebreak()
    ]

    // Spread Final do Mês: Revisão (Esq / Par) + Anotações do Mês (Dir / Ímpar)
    #section-revisao(month-data.monthName, colors, mode: mode)
    #pagebreak()
    #section-anotacoes(colors, title: "Anotações & Insights · " + month-data.monthName)
    #pagebreak()
  ]

  // Páginas Finais de Fechamento do Miolo (Paridade e Equilíbrio Frente/Verso)
  #if mode == "dated" [
    #section-anotacoes(colors, title: "Anotações Finais & Avaliação do Ano")
    #pagebreak()
    #section-anotacoes(colors, title: "Metas & Planejamento para o Próximo Ano")
    #pagebreak()
    #section-anotacoes(colors, title: "Contatos, Informações Importantes & Notas")
  ] else [
    #section-anotacoes(colors, title: "Anotações Finais & Projetos")
    #pagebreak()
    #section-anotacoes(colors, title: "Metas Futuras & Próximos Passos")
    #pagebreak()
    #section-anotacoes(colors, title: "Contatos & Informações Importantes")
    #pagebreak()
    #section-anotacoes(colors, title: "Anotações Pessoais & Listas")
    #pagebreak()
    #section-anotacoes(colors, title: "Notas Finais")
  ]
]

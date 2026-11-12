#import "shared.typ": (
  dotted-block,
  notebook-opening-page,
  rule-line,
  ruled-block,
  section-header,
  studio-colophon,
)

#let diario-abertura(colors, customTitle: "", personalizationName: "", hasLogo: false) = [
  #notebook-opening-page(
    colors,
    modelTitle: "Diário Pessoal",
    modelTagline: "Edição Permanente · Escrita Livre, Reflexões & Memórias do Dia",
    customTitle: customTitle,
    personalizationName: personalizationName,
    hasLogo: hasLogo,
    fields: ("Iniciado em (Data Livre):", "Palavra ou Intenção do Ciclo:"),
    purposeLabel: "Um espaço seguro e atemporal para registrar pensamentos, descobertas e dias vividos:",
  )
]

#let diario-intencoes(colors) = [
  #section-header("Intenções & Ponto de Partida", colors, subtitle: "Abertura Atemporal")

  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: 3mm,
    below: 2.4mm,
  )[
    #text(size: 8.2pt, weight: "bold", fill: colors.primary)[O Momento Presente]
    #v(0.6mm)
    #text(size: 7.2pt, fill: colors.secondary)[Como me sinto ao iniciar este diário e o que desejo guardar nestas páginas:]
    #v(0.6mm)
    #ruled-block(4, colors, height: 5.3mm)
  ]

  #grid(
    columns: (1fr, 1fr),
    gutter: 3mm,
    block(width: 100%, stroke: 0.5pt + colors.lines, radius: 1.8mm, inset: 2.8mm)[
      #text(size: 8.0pt, weight: "bold", fill: colors.primary)[O Que Desejo Cultivar]
      #v(0.6mm)
      #text(size: 7.0pt, fill: colors.secondary)[Hábitos, sentimentos e presenças:]
      #v(0.6mm)
      #ruled-block(5, colors, height: 5.2mm)
    ],
    block(width: 100%, stroke: 0.5pt + colors.lines, radius: 1.8mm, inset: 2.8mm)[
      #text(size: 8.0pt, weight: "bold", fill: colors.primary)[O Que Desejo Deixar Ir]
      #v(0.6mm)
      #text(size: 7.0pt, fill: colors.secondary)[Preocupações e excessos:]
      #v(0.6mm)
      #ruled-block(5, colors, height: 5.2mm)
    ],
  )

  #v(2.4mm)
  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: 3mm,
    below: 2.4mm,
  )[
    #text(size: 8.2pt, weight: "bold", fill: colors.primary)[Pequenos Rituais & Alegrias Cotidianas]
    #v(0.6mm)
    #text(size: 7.2pt, fill: colors.secondary)[Leituras, músicas, lugares, pessoas e momentos que me reconectam:]
    #v(0.6mm)
    #ruled-block(4, colors, height: 5.3mm)
  ]

  #block(
    width: 100%,
    fill: colors.accent.lighten(92%),
    stroke: 0.5pt + colors.accent,
    radius: 1.8mm,
    inset: 2.8mm,
  )[
    #text(size: 7.8pt, weight: "bold", fill: colors.primary)[Carta Breve para Mim Mesmo(a)]
    #v(0.5mm)
    #dotted-block(2, colors, height: 5.1mm)
  ]
]

#let diario-escrita(entryIndex, colors) = [
  #let h-font = colors.at("headingFont", default: auto)
  // Cabeçalho discreto não datado
  #block(width: 100%, below: 1.8mm)[
    #grid(
      columns: (1fr, auto, auto),
      column-gutter: 3mm,
      align: (left + bottom, center + bottom, right + bottom),
      [
        #text(size: 7.2pt, weight: "semibold", fill: colors.secondary)[Tema / Título do Dia:]
        #rule-line(colors, height: 4.8mm)
      ],
      block(
        stroke: 0.45pt + colors.lines,
        radius: 1.3mm,
        inset: (x: 2.4mm, y: 1.4mm),
      )[
        #text(size: 7.0pt, weight: "semibold", fill: colors.secondary)[D  S  T  Q  Q  S  S]
      ],
      block(
        stroke: 0.45pt + colors.lines,
        radius: 1.3mm,
        inset: (x: 2.6mm, y: 1.4mm),
      )[
        #text(size: 7.2pt, weight: "bold", fill: colors.primary)[Data: #h(4.5mm) / #h(4.5mm) / #h(7mm)]
      ],
    )
    #v(1.2mm)
    #line(length: 100%, stroke: 0.55pt + colors.accent)
  ]

  // 21 linhas pautadas para escrita livre
  #ruled-block(21, colors, height: 5.9mm)

  #v(2.2mm)

  // Box inferior de Reflexões do Dia
  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    fill: colors.accent.lighten(94%),
    radius: 1.8mm,
    inset: (x: 3.2mm, y: 2.2mm),
    below: 0pt,
  )[
    #grid(
      columns: (1fr, auto),
      align: horizon,
      text(size: 8.0pt, weight: "bold", fill: colors.primary, font: h-font)[Reflexões do Dia],
      text(size: 6.8pt, fill: colors.secondary)[Gratidão · Aprendizado · Sentimento que fica],
    )
    #v(0.6mm)
    #dotted-block(3, colors, height: 5.2mm)
  ]
]

#let diario-citacoes(pageIdx, colors) = [
  #section-header(
    "Citações, Pensamentos & Memórias Breves",
    colors,
    subtitle: "Frases, Leituras & Instantes para Guardar",
    badge: "Pág. " + str(pageIdx) + "/9",
  )

  #for cardIdx in range(3) [
    #block(
      width: 100%,
      stroke: 0.5pt + colors.lines,
      radius: 1.8mm,
      inset: 3mm,
      below: 2.6mm,
    )[
      #grid(
        columns: (1fr, auto),
        align: horizon,
        text(size: 7.6pt, weight: "bold", fill: colors.primary)[Citação, Ideia ou Lembrança],
        [
          #text(size: 6.9pt, fill: colors.secondary)[Data / Origem / Autor(a): ]
          #box(width: 26mm, height: 2mm, stroke: (bottom: 0.35pt + colors.writing-lines))
        ],
      )
      #v(0.8mm)
      #ruled-block(5, colors, height: 5.5mm)
    ]
  ]

  #block(
    width: 100%,
    stroke: 0.45pt + colors.lines,
    radius: 1.6mm,
    inset: 2.8mm,
  )[
    #text(size: 7.4pt, weight: "bold", fill: colors.secondary)[Notas Livres:]
    #dotted-block(3, colors, height: 5.2mm)
  ]
]

#let render-diario-pessoal(
  colors,
  studio,
  customTitle: "",
  personalizationName: "",
  hasLogo: false,
  watermarkBg: none,
  singleSection: "all",
) = [
  #if singleSection == "abertura" [
    #diario-abertura(colors, customTitle: customTitle, personalizationName: personalizationName, hasLogo: hasLogo)
  ] else if singleSection == "intencoes" [
    #diario-intencoes(colors)
  ] else if singleSection == "escrita" [
    #diario-escrita(1, colors)
  ] else if singleSection == "escrita-impar" [
    #diario-escrita(2, colors)
  ] else if singleSection == "citacoes" [
    #diario-citacoes(1, colors)
  ] else if singleSection == "anotacoes" [
    #diario-citacoes(9, colors)
  ] else [
    // Página 1: Abertura e Identificação
    #diario-abertura(colors, customTitle: customTitle, personalizationName: personalizationName, hasLogo: hasLogo)
    #pagebreak()

    #set page(background: watermarkBg)

    // Página 2: Intenções e Ponto de Partida
    #diario-intencoes(colors)
    #pagebreak()

    // Páginas 3 a 150 (148 páginas): Escrita Livre não datada com box de Reflexões
    #for idx in range(1, 149) [
      #diario-escrita(idx, colors)
      #pagebreak()
    ]

    // Páginas 151 a 159 (9 páginas): Citações, Pensamentos e Memórias Breves
    #for cIdx in range(1, 10) [
      #diario-citacoes(cIdx, colors)
      #pagebreak()
    ]

    // Página 160 (Par): Colofão Institucional 678 Estudio
    #studio-colophon(studio, colors)
  ]
]

#import "shared.typ": (
  dotted-block,
  dotted-line,
  notebook-opening-page,
  rule-line,
  ruled-block,
  section-header,
  studio-colophon,
)

#let _pad3(n) = {
  if n < 10 { "00" + str(n) } else if n < 100 { "0" + str(n) } else { str(n) }
}

#let receitas-abertura(colors, customTitle: "", personalizationName: "", hasLogo: false) = [
  #notebook-opening-page(
    colors,
    modelTitle: "Caderno de Receitas",
    modelTagline: "Acervo Gastronômico · 120 Fichas Culinárias Estruturadas",
    customTitle: customTitle,
    personalizationName: personalizationName,
    hasLogo: hasLogo,
    fields: ("Especialidade / Cozinha Favorita:", "Caderno iniciado em:"),
    purposeLabel: "Tradições de família, aromas e memórias à mesa:",
  )
]

#let receitas-medidas(colors) = [
  #section-header("Guia de Medidas & Equivalências", colors, subtitle: "Referência Rápida de Cozinha")

  #grid(
    columns: (1fr, 1fr),
    gutter: 3.5mm,
    block(width: 100%, stroke: 0.5pt + colors.lines, radius: 1.8mm, inset: 2.6mm)[
      #text(size: 8.2pt, weight: "bold", fill: colors.primary)[Medidas de Volume (Líquidos)]
      #v(1mm)
      #set text(size: 7.2pt)
      #table(
        columns: (1fr, auto),
        stroke: 0.3pt + colors.writing-lines,
        inset: (x: 4pt, y: 2.5pt),
        [*Medida Caseira*], [*Equivalência*],
        [1 xícara de chá], [240 ml],
        [3/4 xícara de chá], [180 ml],
        [2/3 xícara de chá], [160 ml],
        [1/2 xícara de chá], [120 ml],
        [1/3 xícara de chá], [80 ml],
        [1/4 xícara de chá], [60 ml],
        [1 colher de sopa], [15 ml],
        [1 colher de sobremesa], [10 ml],
        [1 colher de chá], [5 ml],
        [1 colher de café], [2,5 ml],
      )
    ],
    block(width: 100%, stroke: 0.5pt + colors.lines, radius: 1.8mm, inset: 2.6mm)[
      #text(size: 8.2pt, weight: "bold", fill: colors.primary)[Pesos de Ingredientes (1 Xícara)]
      #v(1mm)
      #set text(size: 7.2pt)
      #table(
        columns: (1fr, auto),
        stroke: 0.3pt + colors.writing-lines,
        inset: (x: 4pt, y: 2.5pt),
        [*Ingrediente*], [*Peso Aprox.*],
        [Farinha de trigo], [120 g],
        [Açúcar refinado], [180 g],
        [Açúcar cristal / mascavo], [150 g],
        [Amido de milho], [110 g],
        [Chocolate / Cacau em pó], [90 g],
        [Manteiga / Margarina], [200 g],
        [Arroz cru], [185 g],
        [Aveia em flocos], [80 g],
        [Mel / Glucose], [300 g],
        [Queijo ralado], [80 g],
      )
    ],
  )

  #v(2.4mm)
  #block(width: 100%, stroke: 0.5pt + colors.lines, radius: 1.8mm, inset: 2.6mm)[
    #text(size: 8.2pt, weight: "bold", fill: colors.primary)[Temperaturas de Forno & Conversão]
    #v(1mm)
    #set text(size: 7.2pt)
    #table(
      columns: (1.2fr, 1fr, 1fr, 1.8fr),
      stroke: 0.3pt + colors.writing-lines,
      inset: (x: 4pt, y: 2.8pt),
      [*Classificação*], [*Graus Celsius*], [*Fahrenheit*], [*Indicação Culinária*],
      [Forno muito baixo], [140 °C – 150 °C], [275 °F – 300 °F], [Suspiros, merengues e desidratação],
      [Forno baixo], [160 °C – 170 °C], [325 °F], [Assados lentos, biscoitos delicados],
      [Forno médio], [180 °C – 190 °C], [350 °F – 375 °F], [Bolos, tortas, pães de ló e suflês],
      [Forno alto], [200 °C – 220 °C], [400 °F – 425 °F], [Pães rústicos, massas folhadas e carnes],
      [Forno muito alto], [230 °C – 250 °C], [450 °F – 475 °F], [Pizzas, gratinados rápidos e selagem],
    )
  ]

  #v(2.4mm)
  #block(width: 100%, stroke: 0.5pt + colors.lines, radius: 1.8mm, inset: 2.6mm)[
    #text(size: 8.0pt, weight: "bold", fill: colors.primary)[Minhas Conversões & Ingredientes Favoritos]
    #v(0.8mm)
    #ruled-block(3, colors, height: 5.0mm)
  ]
]

#let receitas-indice-page(pageIdx, colors) = [
  #let startNum = pageIdx * 30 + 1
  #let endNum = (pageIdx + 1) * 30
  #section-header(
    "Índice de Receitas",
    colors,
    subtitle: "Receitas " + _pad3(startNum) + " a " + _pad3(endNum),
    badge: "Parte " + str(pageIdx + 1) + "/4",
  )

  #grid(
    columns: (11mm, 1fr, 24mm, 12mm),
    gutter: 2mm,
    align: (center + horizon, left + horizon, center + horizon, right + horizon),
    text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Nº],
    text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Nome da Receita],
    text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Categoria],
    text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Pág.],
  )
  #v(0.8mm)
  #line(length: 100%, stroke: 0.5pt + colors.lines)

  #for offset in range(30) [
    #let rNum = startNum + offset
    #let rPage = 6 + rNum
    #block(width: 100%, height: 4.9mm, above: 0pt, below: 0pt)[
      #grid(
        columns: (11mm, 1fr, 24mm, 12mm),
        gutter: 2mm,
        align: (center + bottom, left + bottom, center + bottom, right + bottom),
        text(size: 7.3pt, weight: "semibold", fill: colors.primary)[#_pad3(rNum)],
        line(length: 100%, stroke: 0.35pt + colors.writing-lines),
        line(length: 100%, stroke: (paint: colors.writing-lines, thickness: 0.35pt, dash: "dotted")),
        text(size: 7.1pt, fill: colors.secondary)[#str(rPage)],
      )
    ]
  ]
]

#let receitas-ficha(recipeNumber, colors) = [
  #let h-font = colors.at("headingFont", default: auto)
  // Cabeçalho da Ficha
  #block(width: 100%, below: 2mm)[
    #grid(
      columns: (1fr, auto),
      column-gutter: 3mm,
      align: (left + bottom, right + bottom),
      [
        #text(size: 7.2pt, weight: "bold", tracking: 0.1em, fill: colors.secondary)[NOME DA RECEITA]
        #rule-line(colors, height: 5.6mm)
      ],
      rect(
        fill: colors.accent.lighten(86%),
        stroke: 0.5pt + colors.accent,
        radius: 1.5mm,
        inset: (x: 3mm, y: 1.6mm),
      )[
        #text(size: 8.5pt, weight: "bold", fill: colors.primary, font: h-font)[RECEITA Nº #_pad3(recipeNumber)]
      ],
    )
    #v(1.6mm)
    #grid(
      columns: (1fr, 1fr, 1.35fr),
      column-gutter: 2.5mm,
      block(stroke: 0.45pt + colors.lines, radius: 1.2mm, inset: (x: 2.2mm, y: 1.4mm), width: 100%)[
        #text(size: 6.8pt, weight: "bold", fill: colors.secondary)[TEMPO DE PREPARO:]
        #h(2pt) #box(width: 14mm, height: 2mm, stroke: (bottom: 0.35pt + colors.writing-lines))
      ],
      block(stroke: 0.45pt + colors.lines, radius: 1.2mm, inset: (x: 2.2mm, y: 1.4mm), width: 100%)[
        #text(size: 6.8pt, weight: "bold", fill: colors.secondary)[RENDIMENTO:]
        #h(2pt) #box(width: 16mm, height: 2mm, stroke: (bottom: 0.35pt + colors.writing-lines))
      ],
      block(stroke: 0.45pt + colors.lines, radius: 1.2mm, inset: (x: 2.2mm, y: 1.4mm), width: 100%)[
        #text(size: 6.8pt, weight: "bold", fill: colors.secondary)[CATEGORIA:]
        #h(2pt) #text(size: 6.8pt, fill: colors.primary)[□ Doce  □ Salgado  □ Outro]
      ],
    )
  ]

  // Bloco Superior: Ingredientes em 2 subcolunas (14 linhas totais)
  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: (x: 3mm, y: 2.4mm),
    below: 2.2mm,
  )[
    #grid(
      columns: (1fr, auto),
      align: horizon,
      text(size: 8.4pt, weight: "bold", fill: colors.primary, font: h-font)[Ingredientes],
      text(size: 6.8pt, fill: colors.secondary)[Quantidade · Item],
    )
    #v(1mm)
    #line(length: 100%, stroke: 0.45pt + colors.accent)
    #v(0.6mm)
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 4mm,
      [
        #for _ in range(7) [
          #block(width: 100%, above: 0pt, below: 0pt)[
            #grid(
              columns: (2.6mm, 1fr),
              column-gutter: 1.5mm,
              align: horizon,
              circle(radius: 0.9mm, stroke: 0.45pt + colors.secondary),
              rule-line(colors, height: 5.1mm),
            )
          ]
        ]
      ],
      [
        #for _ in range(7) [
          #block(width: 100%, above: 0pt, below: 0pt)[
            #grid(
              columns: (2.6mm, 1fr),
              column-gutter: 1.5mm,
              align: horizon,
              circle(radius: 0.9mm, stroke: 0.45pt + colors.secondary),
              rule-line(colors, height: 5.1mm),
            )
          ]
        ]
      ],
    )
  ]

  // Bloco Central: Modo de Preparo em largura total (10 linhas amplas)
  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: (x: 3mm, y: 2.4mm),
    below: 2.2mm,
  )[
    #grid(
      columns: (1fr, auto),
      align: horizon,
      text(size: 8.4pt, weight: "bold", fill: colors.primary, font: h-font)[Modo de Preparo],
      text(size: 6.8pt, fill: colors.secondary)[Passo a passo detalhado],
    )
    #v(1mm)
    #line(length: 100%, stroke: 0.45pt + colors.accent)
    #v(0.4mm)
    #ruled-block(10, colors, height: 5.5mm)
  ]

  // Bloco Inferior: Observações e Dicas em largura total (3 linhas)
  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: (x: 3mm, y: 2.2mm),
    below: 0pt,
  )[
    #grid(
      columns: (1fr, auto),
      align: horizon,
      text(size: 8.0pt, weight: "bold", fill: colors.primary, font: h-font)[Observações, Segredos & Dicas],
      text(size: 6.8pt, fill: colors.secondary)[Toque do chef · Substituições · Harmonização],
    )
    #v(0.8mm)
    #dotted-block(3, colors, height: 5.1mm)
  ]
]

#let receitas-notas(noteIdx, colors) = [
  #section-header(
    "Notas Culinárias & Testes de Cardápio",
    colors,
    subtitle: "Anotações Livres, Cardápios & Planejamento",
    badge: "Notas " + str(noteIdx),
  )
  #block(
    width: 100%,
    stroke: 0.45pt + colors.lines,
    radius: 1.6mm,
    inset: 2.6mm,
    below: 2mm,
  )[
    #text(size: 7.5pt, weight: "bold", fill: colors.secondary)[Ocasião / Cardápio / Ideia Gastronômica:]
    #rule-line(colors, height: 5.0mm)
  ]
  #ruled-block(16, colors, height: 5.8mm)
  #v(1.8mm)
  #block(
    width: 100%,
    stroke: 0.45pt + colors.lines,
    radius: 1.6mm,
    inset: 2.4mm,
  )[
    #text(size: 7.3pt, weight: "bold", fill: colors.secondary)[Ingredientes para Comprar / Ajustes para a Próxima Vez:]
    #dotted-block(3, colors, height: 5.0mm)
  ]
]

#let render-caderno-receitas(
  colors,
  studio,
  customTitle: "",
  personalizationName: "",
  hasLogo: false,
  watermarkBg: none,
  singleSection: "all",
) = [
  #if singleSection == "abertura" [
    #receitas-abertura(colors, customTitle: customTitle, personalizationName: personalizationName, hasLogo: hasLogo)
  ] else if singleSection == "medidas" [
    #receitas-medidas(colors)
  ] else if singleSection == "indice" [
    #receitas-indice-page(0, colors)
  ] else if singleSection == "ficha" [
    #receitas-ficha(1, colors)
  ] else if singleSection == "ficha-par" [
    #receitas-ficha(2, colors)
  ] else if singleSection == "anotacoes" [
    #receitas-notas(1, colors)
  ] else [
    // Página 1: Abertura e Identificação
    #receitas-abertura(colors, customTitle: customTitle, personalizationName: personalizationName, hasLogo: hasLogo)
    #pagebreak()

    #set page(background: watermarkBg)

    // Página 2: Guia de Medidas e Equivalências
    #receitas-medidas(colors)
    #pagebreak()

    // Páginas 3 a 6 (4 páginas): Índice numerado de 001 a 120
    #for idx in range(4) [
      #receitas-indice-page(idx, colors)
      #pagebreak()
    ]

    // Páginas 7 a 126 (120 páginas): 120 Fichas de Receitas
    #for num in range(1, 121) [
      #receitas-ficha(num, colors)
      #pagebreak()
    ]

    // Páginas 127 a 139 (13 páginas): Notas Culinárias e Testes de Cardápio
    #for nIdx in range(1, 14) [
      #receitas-notas(nIdx, colors)
      #pagebreak()
    ]

    // Página 140 (Par): Colofão Institucional 678 Estudio
    #studio-colophon(studio, colors)
  ]
]

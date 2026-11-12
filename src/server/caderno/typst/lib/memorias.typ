#import "shared.typ": (
  dotted-block,
  labeled-field,
  notebook-opening-page,
  rule-line,
  ruled-block,
  section-header,
  studio-colophon,
)

#let _pad2(n) = {
  if n < 10 { "0" + str(n) } else { str(n) }
}

// Página 1 (Ímpar / Direita): Apresentação e Identificação
#let memorias-apresentacao(colors, customTitle: "", personalizationName: "", hasLogo: false) = [
  #notebook-opening-page(
    colors,
    modelTitle: "Livro de Memórias",
    modelTagline: "52 Aberturas Duplas para Fotografias, Relatos & Recordações",
    customTitle: customTitle,
    personalizationName: personalizationName,
    hasLogo: hasLogo,
    fields: ("Período / Capítulo de Vida:", "Família / Protagonistas:"),
    purposeLabel: "Uma coleção de instantes, encontros e histórias para atravessar o tempo:",
  )
]

// Página 2 (Par / Esquerda): Dedicatória Opcional
#let memorias-dedicatoria(colors, dedication: "") = [
  #let h-font = colors.at("headingFont", default: auto)
  #section-header("Dedicatória", colors, subtitle: "Palavras que abrem este livro")

  #v(4mm)
  #block(
    width: 100%,
    stroke: 0.6pt + colors.accent,
    fill: colors.accent.lighten(95%),
    radius: 2.5mm,
    inset: 6mm,
  )[
    #align(center)[
      #text(size: 7.5pt, tracking: 0.16em, weight: "semibold", fill: colors.secondary)[COM AFETO E MEMÓRIA]
      #v(3mm)
      #line(length: 35%, stroke: 0.5pt + colors.accent)
    ]
    #v(4mm)
    #if dedication != "" [
      #align(center)[
        #block(width: 92%, inset: (y: 4mm))[
          #text(size: 10.5pt, style: "italic", fill: colors.primary, font: h-font)[“#dedication”]
        ]
      ]
      #v(4mm)
      #ruled-block(8, colors, height: 6.2mm)
    ] else [
      #text(size: 7.8pt, fill: colors.secondary)[Espaço reservado para uma dedicatória especial à mão:]
      #v(2mm)
      #ruled-block(13, colors, height: 6.2mm)
    ]
    #v(4mm)
    #grid(
      columns: (1fr, 1fr),
      gutter: 6mm,
      labeled-field("Local e Data:", colors, height: 5.5mm),
      labeled-field("Assinatura / De:", colors, height: 5.5mm),
    )
  ]
]

// Página 3 (Ímpar / Direita): Guia Afetivo & Cápsula do Tempo (garante que o Sumário inicie na pág. 4 par)
#let memorias-guia-afetivo(colors) = [
  #section-header("Cápsula do Tempo & Guia Afetivo", colors, subtitle: "Retrato da Nossa Época")

  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: 3.5mm,
    below: 3mm,
  )[
    #text(size: 8.4pt, weight: "bold", fill: colors.primary)[Nosso Mundo Neste Momento]
    #v(1.2mm)
    #grid(
      columns: (1fr, 1fr),
      gutter: 3.5mm,
      labeled-field("Nossa casa / cidade especial:", colors, height: 5.2mm),
      labeled-field("Músicas que marcam esta fase:", colors, height: 5.2mm),
      labeled-field("Filmes, livros ou histórias favoritas:", colors, height: 5.2mm),
      labeled-field("Tradições que mais amamos:", colors, height: 5.2mm),
    )
  ]

  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: 3.5mm,
    below: 3mm,
  )[
    #text(size: 8.4pt, weight: "bold", fill: colors.primary)[Pessoas, Amigos & Presenças Inesquecíveis]
    #v(0.8mm)
    #ruled-block(6, colors, height: 5.6mm)
  ]

  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: 3.5mm,
  )[
    #text(size: 8.4pt, weight: "bold", fill: colors.primary)[Sonhos & Votos para os Próximos Anos]
    #v(0.8mm)
    #ruled-block(6, colors, height: 5.6mm)
  ]
]

// Páginas 4 e 5 (Spread Duplo): Sumário dos 52 Momentos Inesquecíveis (26 por página)
#let memorias-sumario(partIdx, colors) = [
  #let startIdx = partIdx * 26 + 1
  #let endIdx = (partIdx + 1) * 26
  #section-header(
    "Sumário de Momentos Inesquecíveis",
    colors,
    subtitle: "Acontecimentos " + _pad2(startIdx) + " a " + _pad2(endIdx),
    badge: "Parte " + str(partIdx + 1) + "/2",
  )

  #grid(
    columns: (10mm, 1fr, 22mm, 14mm),
    gutter: 2mm,
    align: (center + horizon, left + horizon, center + horizon, right + horizon),
    text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Nº],
    text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Acontecimento / Memória],
    text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Data],
    text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Págs.],
  )
  #v(0.8mm)
  #line(length: 100%, stroke: 0.5pt + colors.lines)

  #for offset in range(26) [
    #let mNum = startIdx + offset
    #let evenPage = 2 * mNum + 4
    #let oddPage = 2 * mNum + 5
    #block(width: 100%, height: 5.6mm, above: 0pt, below: 0pt)[
      #grid(
        columns: (10mm, 1fr, 22mm, 14mm),
        gutter: 2mm,
        align: (center + bottom, left + bottom, center + bottom, right + bottom),
        text(size: 7.3pt, weight: "semibold", fill: colors.primary)[#_pad2(mNum)],
        line(length: 100%, stroke: 0.35pt + colors.writing-lines),
        line(length: 100%, stroke: (paint: colors.writing-lines, thickness: 0.35pt, dash: "dotted")),
        text(size: 7.0pt, fill: colors.secondary)[#str(evenPage)–#str(oddPage)],
      )
    ]
  ]
]

// Página Par (Esquerda / Verso do Spread): Fotografia, Data, Local e Participantes
#let memorias-spread-esquerda(eventIdx, colors) = [
  #context [#metadata((kind: "memoria-esquerda", index: eventIdx, page: here().page())) <memoria-spread>]
  #let h-font = colors.at("headingFont", default: auto)

  #section-header(
    "Acontecimento #" + _pad2(eventIdx),
    colors,
    subtitle: "Fotografia, Data & Local",
    badge: "Memória " + _pad2(eventIdx) + "/52",
  )

  // Moldura Elegante para Fotografia (92mm de altura)
  #block(
    width: 100%,
    height: 92mm,
    stroke: (paint: colors.accent, thickness: 0.65pt, dash: "dashed"),
    fill: colors.accent.lighten(96%),
    radius: 2.2mm,
    inset: 4mm,
    below: 2.5mm,
  )[
    #place(top + left, line(length: 6mm, stroke: 0.9pt + colors.primary))
    #place(top + left, line(angle: 90deg, length: 6mm, stroke: 0.9pt + colors.primary))
    #place(top + right, line(length: -6mm, stroke: 0.9pt + colors.primary))
    #place(top + right, line(angle: 90deg, length: 6mm, stroke: 0.9pt + colors.primary))
    #place(bottom + left, line(length: 6mm, stroke: 0.9pt + colors.primary))
    #place(bottom + left, line(angle: -90deg, length: 6mm, stroke: 0.9pt + colors.primary))
    #place(bottom + right, line(length: -6mm, stroke: 0.9pt + colors.primary))
    #place(bottom + right, line(angle: -90deg, length: 6mm, stroke: 0.9pt + colors.primary))

    #align(center + horizon)[
      #text(size: 9pt, weight: "semibold", fill: colors.secondary, font: h-font)[Espaço para Fotografia ou Lembrança Visual]
      #v(1.5mm)
      #text(size: 7.4pt, fill: colors.secondary)[Formatos sugeridos: 10 × 15 cm · 9 × 13 cm · Polaroid / Instax]
    ]
  ]

  // Legenda da foto
  #block(width: 100%, below: 2.5mm)[
    #text(size: 7.2pt, weight: "semibold", fill: colors.secondary)[Legenda da Fotografia:]
    #rule-line(colors, height: 5.0mm)
  ]

  // Ficha do Acontecimento: Título, Data, Local e Participantes
  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: 3.2mm,
    below: 0pt,
  )[
    #labeled-field("Título do Acontecimento:", colors, height: 5.2mm)
    #v(1.6mm)
    #grid(
      columns: (1fr, 1.3fr),
      gutter: 3.5mm,
      labeled-field("Data do Momento:", colors, height: 5.2mm),
      labeled-field("Local / Cidade:", colors, height: 5.2mm),
    )
    #v(1.6mm)
    #text(size: 7.4pt, weight: "semibold", fill: colors.secondary)[Quem Estava Presente:]
    #ruled-block(3, colors, height: 5.1mm)
  ]
]

// Página Ímpar (Direita / Frente do Spread): Relato Completo e Recordações
#let memorias-spread-direita(eventIdx, colors) = [
  #context [#metadata((kind: "memoria-direita", index: eventIdx, page: here().page())) <memoria-spread>]
  #let h-font = colors.at("headingFont", default: auto)

  #section-header(
    "Relato & Recordações",
    colors,
    subtitle: "A História do Acontecimento #" + _pad2(eventIdx),
    badge: "Memória " + _pad2(eventIdx) + "/52",
  )

  // Área Principal de Relato (19 linhas pautadas)
  #block(width: 100%, below: 2.5mm)[
    #text(size: 7.5pt, weight: "semibold", fill: colors.secondary)[A história deste dia, conversas, risadas e sentimentos:]
    #v(0.6mm)
    #ruled-block(19, colors, height: 5.8mm)
  ]

  // Box Inferior: Detalhes & Recordações Especiais
  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    fill: colors.accent.lighten(94%),
    radius: 1.8mm,
    inset: (x: 3.2mm, y: 2.4mm),
    below: 0pt,
  )[
    #grid(
      columns: (1fr, auto),
      align: horizon,
      text(size: 8.2pt, weight: "bold", fill: colors.primary, font: h-font)[O Que Mais Nos Marcou],
      text(size: 6.8pt, fill: colors.secondary)[Frase · Música · Detalhe inesquecível],
    )
    #v(0.8mm)
    #dotted-block(4, colors, height: 5.2mm)
  ]
]

// Páginas 110 a 119 (10 páginas): Recordações Especiais, Cartas & Anotações
#let memorias-recordacoes(pageIdx, colors) = [
  #section-header(
    "Recordações Especiais & Cartas para o Futuro",
    colors,
    subtitle: "Bilhetes, Lembranças & Anotações",
    badge: "Extra " + str(pageIdx) + "/10",
  )

  #block(
    width: 100%,
    stroke: 0.5pt + colors.lines,
    radius: 1.8mm,
    inset: 3mm,
    below: 2.5mm,
  )[
    #grid(
      columns: (1.4fr, 1fr),
      gutter: 3mm,
      labeled-field("Tema / Destinatário / Lembrança:", colors, height: 5.0mm),
      labeled-field("Data / Época:", colors, height: 5.0mm),
    )
  ]

  #ruled-block(21, colors, height: 5.9mm)
]

#let render-livro-memorias(
  colors,
  studio,
  customTitle: "",
  personalizationName: "",
  dedication: "",
  hasLogo: false,
  watermarkBg: none,
  singleSection: "all",
) = [
  #if singleSection == "abertura" [
    #memorias-apresentacao(colors, customTitle: customTitle, personalizationName: personalizationName, hasLogo: hasLogo)
  ] else if singleSection == "dedicatoria" [
    #memorias-dedicatoria(colors, dedication: dedication)
  ] else if singleSection == "sumario" [
    #memorias-sumario(0, colors)
  ] else if singleSection == "memoria-esquerda" [
    #memorias-spread-esquerda(1, colors)
  ] else if singleSection == "memoria-direita" [
    #memorias-spread-direita(1, colors)
  ] else if singleSection == "recordacoes" or singleSection == "anotacoes" [
    #memorias-recordacoes(1, colors)
  ] else [
    // Página 1 (Ímpar / Direita): Apresentação e Identificação
    #memorias-apresentacao(colors, customTitle: customTitle, personalizationName: personalizationName, hasLogo: hasLogo)
    #pagebreak()

    #set page(background: watermarkBg)

    // Página 2 (Par / Esquerda): Dedicatória Opcional
    #memorias-dedicatoria(colors, dedication: dedication)
    #pagebreak()

    // Página 3 (Ímpar / Direita): Guia Afetivo & Cápsula do Tempo
    #memorias-guia-afetivo(colors)
    #pagebreak()

    // Páginas 4 e 5 (Spread Duplo: Par + Ímpar): Sumário dos 52 Momentos
    #memorias-sumario(0, colors)
    #pagebreak()
    #memorias-sumario(1, colors)
    #pagebreak()

    // Páginas 6 a 109 (52 Aberturas Duplas = 104 páginas):
    // Página Par (2i+4, Esquerda): Foto, Data, Local e Participantes
    // Página Ímpar (2i+5, Direita): Relato e Recordações
    #for eventIdx in range(1, 53) [
      #memorias-spread-esquerda(eventIdx, colors)
      #pagebreak()
      #memorias-spread-direita(eventIdx, colors)
      #pagebreak()
    ]

    // Páginas 110 a 119 (10 páginas): Recordações Especiais e Anotações
    #for rIdx in range(1, 11) [
      #memorias-recordacoes(rIdx, colors)
      #pagebreak()
    ]

    // Página 120 (Par / Esquerda): Colofão Institucional 678 Estudio
    #studio-colophon(studio, colors)
  ]
]


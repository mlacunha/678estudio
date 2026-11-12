// Biblioteca compartilhada para os 3 modelos de Cadernos Personalizados A5 (678 Estudio)

#let rule-line(colors, height: 5.8mm) = {
  block(width: 100%, height: height, above: 0pt, below: 0pt)[
    #place(bottom, line(length: 100%, stroke: colors.writing-lines + 0.38pt))
  ]
}

#let dotted-line(colors, height: 5.8mm) = {
  block(width: 100%, height: height, above: 0pt, below: 0pt)[
    #place(bottom, line(length: 100%, stroke: (paint: colors.writing-lines, thickness: 0.45pt, dash: "dotted")))
  ]
}

#let ruled-block(count, colors, height: 6.2mm) = {
  for _ in range(count) {
    rule-line(colors, height: height)
  }
}

#let dotted-block(count, colors, height: 6.0mm) = {
  for _ in range(count) {
    dotted-line(colors, height: height)
  }
}

#let labeled-field(label, colors, height: 5.6mm) = {
  block(width: 100%, above: 0pt, below: 0pt)[
    #text(size: 7.4pt, weight: "semibold", fill: colors.secondary)[#label]
    #rule-line(colors, height: height)
  ]
}

#let section-header(title, colors, subtitle: none, badge: none) = [
  #let h-font = colors.at("headingFont", default: auto)
  #block(width: 100%, below: 2.8mm)[
    #grid(
      columns: (1fr, auto),
      align: (left + bottom, right + bottom),
      [
        #text(size: 14pt, weight: "bold", fill: colors.primary, font: h-font)[#title]
        #if subtitle != none [
          #h(4pt) #text(size: 8.8pt, fill: colors.secondary)[· #subtitle]
        ]
      ],
      if badge != none [
        #rect(
          fill: colors.accent.lighten(86%),
          stroke: 0.45pt + colors.accent,
          radius: 1.5mm,
          inset: (x: 2.5mm, y: 1.1mm),
        )[
          #text(size: 7.4pt, weight: "bold", fill: colors.primary)[#badge]
        ]
      ] else [],
    )
    #v(1.2mm)
    #line(length: 100%, stroke: colors.accent + 0.8pt)
  ]
]

#let notebook-opening-page(
  colors,
  modelTitle: "Caderno Personalizado",
  modelTagline: "Edição Especial · Papelaria Artesanal",
  customTitle: "",
  personalizationName: "",
  hasLogo: false,
  fields: (),
  purposeLabel: "Notas de abertura & inspiração:",
) = [
  #let h-font = colors.at("headingFont", default: auto)
  #let display-title = if customTitle != "" { customTitle } else { modelTitle }

  #if hasLogo [
    #v(2mm)
    #align(center)[
      #block(width: 56mm, height: 22mm, inset: 1.5mm)[
        #align(center + horizon)[
          #image("../logo.png", width: 100%, height: 100%, fit: "contain")
        ]
      ]
    ]
    #v(2mm)
  ] else [
    #v(10mm)
  ]

  #align(center)[
    #text(size: 7.5pt, weight: "semibold", tracking: 0.18em, fill: colors.accent)[678 ESTUDIO · PAPELARIA PERSONALIZADA]
    #v(2.5mm)
    #text(size: 21pt, weight: "bold", fill: colors.primary, font: h-font)[#display-title]
    #v(1.8mm)
    #text(size: 9.5pt, fill: colors.secondary)[#modelTagline]
    #v(2.5mm)
    #line(length: 42%, stroke: 0.6pt + colors.accent)
  ]

  #v(6mm)

  #block(
    width: 100%,
    stroke: 0.55pt + colors.lines,
    radius: 2mm,
    inset: 4.5mm,
  )[
    #text(size: 9pt, weight: "bold", fill: colors.primary)[Identificação]
    #v(2mm)
    #text(size: 7.8pt, fill: colors.secondary)[Pertence a / Identificação:]
    #if personalizationName != "" [
      #v(0.8mm)
      #text(size: 11pt, weight: "bold", fill: colors.primary)[#personalizationName]
    ]
    #rule-line(colors, height: 5.2mm)
    #v(1.8mm)
    #grid(
      columns: (1fr, 1fr),
      gutter: 3.5mm,
      labeled-field("Telefone / WhatsApp:", colors, height: 5.0mm),
      labeled-field("E-mail / Contato:", colors, height: 5.0mm),
    )
    #if fields.len() >= 2 [
      #v(1.8mm)
      #grid(
        columns: (1fr, 1fr),
        gutter: 3.5mm,
        labeled-field(fields.at(0), colors, height: 5.0mm),
        labeled-field(fields.at(1), colors, height: 5.0mm),
      )
    ]
    #v(2mm)
    #text(size: 7.8pt, fill: colors.secondary)[#purposeLabel]
    #rule-line(colors, height: 5.5mm)
    #rule-line(colors, height: 5.5mm)
  ]

  #v(1fr)
  #align(center)[
    #text(size: 7.5pt, fill: colors.secondary)[Edição A5 encadernada · Produzida sob encomenda]
  ]
]

#let studio-colophon(studio, colors) = align(center + horizon)[
  #let h-font = colors.at("headingFont", default: auto)
  #block(
    width: 88%,
    inset: (x: 14pt, y: 18pt),
    stroke: 0.5pt + colors.lines,
    radius: 4pt,
    [
      #image("../brand-678.png", width: 22mm)
      #v(4mm)
      #text(font: h-font, size: 16pt, weight: "bold", fill: colors.primary)[678 Estudio]
      #v(1.5mm)
      #text(size: 8pt, tracking: 0.14em, fill: colors.secondary)[DESIGN & PAPELARIA PERSONALIZADA]
      #v(5mm)
      #line(length: 45%, stroke: 0.5pt + colors.secondary)
      #v(5mm)
      #set text(size: 8.5pt, fill: colors.primary)
      #if studio.at("instagram", default: "") != "" [
        *Instagram:* #studio.at("instagram") \
        #v(1.5mm)
      ]
      #if studio.at("site", default: "") != "" [
        *Site oficial:* #studio.at("site") \
        #v(1.5mm)
      ]
      #if studio.at("whatsapp", default: "") != "" [
        *WhatsApp:* #studio.at("whatsapp") \
        #v(1.5mm)
      ]
      #if studio.at("email", default: "") != "" [
        *E-mail:* #studio.at("email") \
      ]
      #v(4mm)
      #text(size: 7.2pt, fill: colors.primary.lighten(35%))[Produzido artesanalmente pelo 678 Estudio.]
    ],
  )
]


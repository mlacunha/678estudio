#import "style.typ": s-subhead, s-label, soft-panel

#let heading(title, colors, style) = block(width: 100%, above: 0pt, below: 0pt)[
  #text(font: style.font-display, size: 20pt, fill: colors.primary, title)
  #v(3.5mm)
  #line(length: 100%, stroke: colors.secondary + 1pt)
  #v(4.5mm)
]

#let ruled(count, colors, spacing: 7mm) = {
  for i in range(count) {
    block(width: 100%, height: spacing, above: 0pt, below: 0pt)[
      #place(bottom, line(length: 100%, stroke: colors.writing-lines + 0.3pt))
    ]
  }
}

#let opening(year, colors, style) = [
  #v(26mm)
  #heading("Agenda " + str(year), colors, style)
  #s-subhead(style, "Um ano de possibilidades", fill: colors.secondary)
  #v(18mm)
  Esta agenda pertence a:
  #ruled(2, colors)
  #v(6mm)
  Contato / Telefone:
  #ruled(1, colors)
  #v(12mm)
  #soft-panel(colors)[Organize seus compromissos, finanças mensais e metas com clareza ao longo de todo o ano.]
]

#let annual-calendar(year, months, colors, style, subtitle: none) = [
  #heading("Calendário anual · " + str(year), colors, style)
  #if subtitle != none [
    #text(size: 8.5pt, fill: colors.secondary, subtitle)
    #v(3mm)
  ]
  #grid(columns: (1fr, 1fr, 1fr), gutter: 4mm, ..range(1, 13).map(month => {
    let first = datetime(year: year, month: month, day: 1)
    let next = if month == 12 { datetime(year: year + 1, month: 1, day: 1) } else { datetime(year: year, month: month + 1, day: 1) }
    let count = int((next - first).days())
    block(breakable: false)[
      #text(size: 9pt, weight: "bold", fill: colors.secondary, months.at(month - 1))
      #v(2mm)
      #set text(size: 6pt)
      #grid(columns: (1fr,) * 7, row-gutter: 2mm,
        ..("S", "T", "Q", "Q", "S", "S", "D"),
        ..range(first.weekday() - 1).map(_ => []),
        ..range(1, count + 1).map(day => str(day)))
    ]
  }))
]

#let personal-data(colors, style) = [
  #heading("Dados pessoais", colors, style)
  #for label in ("Nome", "Telefone / WhatsApp", "E-mail", "Endereço", "Contato de emergência", "Telefone de emergência") [
    #s-label(style, label, fill: colors.primary)
    #ruled(1, colors)
    #v(4mm)
  ]
]

#let monthly-plan(year, month, name, colors, style) = [
  #heading(name + " · " + str(year), colors, style)
  #s-subhead(style, "Objetivos e compromissos do mês", fill: colors.secondary)
  #ruled(11, colors, spacing: 6.8mm)
  #v(5mm)
  #s-subhead(style, "Datas importantes e lembretes", fill: colors.secondary)
  #ruled(7, colors, spacing: 6.8mm)
]

#let _pay-box(colors) = box(
  width: 3.2mm,
  height: 3.2mm,
  stroke: 0.45pt + colors.secondary,
  radius: 0.6pt,
)

#let monthly-finance(month-name, year, colors, style) = block(width: 100%, above: 0pt, below: 0pt)[
  #heading("Controle financeiro · " + month-name + " " + str(year), colors, style)
  #s-subhead(style, "Contas, vencimentos e controle de pagamento", fill: colors.secondary)
  #v(1.5mm)
  #set text(size: 7.2pt)
  #table(
    columns: (1fr, 18mm, 24mm, 14mm),
    inset: (x: 4pt, y: 3.1pt),
    stroke: colors.lines + 0.35pt,
    align: (left + horizon, center + horizon, right + horizon, center + horizon),
    table.header(
      [*Conta / Compromisso*],
      [*Vencimento*],
      [*Valor (R\$)*],
      [*Pago*],
    ),
    ..range(7).map(_ => ([ ], [\/], [ ], _pay-box(colors))).flatten(),
  )
  #v(3.5mm)
  #s-subhead(style, "Receitas, despesas e lançamentos adicionais", fill: colors.secondary)
  #v(1.5mm)
  #table(
    columns: (14mm, 1fr, 23mm, 23mm, 13mm),
    inset: (x: 4pt, y: 3.1pt),
    stroke: colors.lines + 0.35pt,
    align: (center + horizon, left + horizon, right + horizon, right + horizon, center + horizon),
    table.header(
      [*Data*],
      [*Descrição (Receita / Despesa)*],
      [*Receitas (R\$)*],
      [*Despesas (R\$)*],
      [*Pago*],
    ),
    ..range(12).map(_ => ([\/], [ ], [ ], [ ], _pay-box(colors))).flatten(),
  )
  #v(3.5mm)
  #soft-panel(colors, inset: (x: 8pt, y: 6pt))[
    #grid(
      columns: (1fr, 1fr, 1fr),
      column-gutter: 4mm,
      stack(
        spacing: 3mm,
        text(size: 7.2pt, weight: "bold", fill: colors.primary)[Total de entradas (R\$)],
        line(length: 100%, stroke: colors.lines + 0.45pt),
      ),
      stack(
        spacing: 3mm,
        text(size: 7.2pt, weight: "bold", fill: colors.primary)[Total de saídas (R\$)],
        line(length: 100%, stroke: colors.lines + 0.45pt),
      ),
      stack(
        spacing: 3mm,
        text(size: 7.2pt, weight: "bold", fill: colors.secondary)[Saldo do mês (R\$)],
        line(length: 100%, stroke: colors.secondary + 0.6pt),
      ),
    )
  ]
]

#let finance(colors, style) = monthly-finance("Anual", "", colors, style)

#let _contact-field(label, label-color, line-color) = grid(
  columns: (auto, 1fr),
  column-gutter: 1.5mm,
  align: bottom,
  text(weight: "bold", fill: label-color, label),
  box(width: 100%, height: 5.0mm, stroke: (bottom: 0.35pt + line-color)),
)

#let contacts-page(colors, style) = block(width: 100%, above: 0pt, below: 0pt)[
  #heading("Cadastro de contatos", colors, style)
  #set text(size: 7.2pt, fill: colors.primary)
  #stack(
    spacing: 2.0mm,
    ..range(9).map(_ => block(
      width: 100%,
      inset: (x: 6pt, y: 4.4pt),
      stroke: 0.4pt + colors.lines,
      radius: 2pt,
      above: 0pt,
      below: 0pt,
      grid(
        columns: (1fr,),
        row-gutter: 2.7mm,
        grid(
          columns: (1.3fr, 1fr),
          column-gutter: 3mm,
          _contact-field("Nome:", colors.secondary, colors.writing-lines),
          _contact-field("Telefone / WhatsApp:", colors.secondary, colors.writing-lines),
        ),
        grid(
          columns: (1fr, 1fr),
          column-gutter: 3mm,
          _contact-field("E-mail:", colors.primary.lighten(20%), colors.writing-lines),
          _contact-field("Observações:", colors.primary.lighten(20%), colors.writing-lines),
        ),
      ),
    )),
  )
]

#let notes(colors, style) = [
  #heading("Anotações", colors, style)
  #ruled(21, colors, spacing: 7mm)
]

#let studio-colophon(studio, colors, style) = align(center + horizon)[
  #block(
    width: 88%,
    inset: (x: 14pt, y: 18pt),
    stroke: 0.5pt + colors.lines,
    radius: 4pt,
    [
      #image("../brand-678.png", width: 22mm)
      #v(4mm)
      #text(font: style.font-display, size: 16pt, weight: "bold", fill: colors.primary)[678 Estudio]
      #v(1.5mm)
      #text(font: style.font-sans, size: 8pt, tracking: 0.14em, fill: colors.secondary)[DESIGN & PAPELARIA PERSONALIZADA]
      #v(5mm)
      #line(length: 45%, stroke: 0.5pt + colors.secondary)
      #v(5mm)
      #set text(font: style.font-sans, size: 8.5pt, fill: colors.primary)
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

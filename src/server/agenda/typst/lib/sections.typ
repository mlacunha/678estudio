#import "style.typ": s-subhead, s-label, soft-panel
#let heading(title, colors, style) = [
  #text(font: style.font-display, size: 22pt, fill: colors.primary, title)
  #v(5mm)
  #line(length: 100%, stroke: colors.secondary + 1pt)
  #v(6mm)
]
#let ruled(count, colors, spacing: 7mm) = {
  for i in range(count) { block(width: 100%, height: spacing, above: 0pt, below: 0pt)[#place(bottom, line(length: 100%, stroke: colors.writing-lines + 0.3pt))] }
}
#let opening(year, colors, style) = [
  #v(30mm)
  #heading("Agenda " + str(year), colors, style)
  #s-subhead(style, "Um ano de possibilidades", fill: colors.secondary)
  #v(20mm)
  Esta agenda pertence a:
  #ruled(2, colors)
  #v(12mm)
  #soft-panel(colors)[Organize seus compromissos e reserve espaço para o que importa.]
]
#let annual-calendar(year, months, colors, style) = [
  #heading("Calendário anual · " + str(year), colors, style)
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
  #for label in ("Nome", "Telefone", "E-mail", "Endereço", "Contato de emergência", "Telefone de emergência") [
    #s-label(style, label, fill: colors.primary)
    #ruled(1, colors)
    #v(4mm)
  ]
]
#let monthly-plan(year, month, name, colors, style) = [
  #heading(name + " · " + str(year), colors, style)
  #s-subhead(style, "Compromissos do mês", fill: colors.secondary)
  #ruled(10, colors)
  #v(6mm)
  #s-subhead(style, "Lembretes", fill: colors.secondary)
  #ruled(4, colors)
]
#let finance(colors, style) = [
  #heading("Controle financeiro", colors, style)
  #text(size: 8pt)[Registro básico de entradas e saídas · Valores em reais]
  #v(5mm)
  #table(columns: (15mm, 1fr, 22mm, 22mm), inset: 5pt,
    stroke: colors.lines + 0.4pt,
    table.header([Data], [Descrição], [Entrada], [Saída]),
    ..range(16).map(_ => ([ ], [ ], [ ], [ ])).flatten())
  #v(6mm)
  Saldo: #line(length: 50%, stroke: colors.lines + 0.4pt)
]
#let notes(colors, style) = [
  #heading("Anotações", colors, style)
  #ruled(19, colors)
]

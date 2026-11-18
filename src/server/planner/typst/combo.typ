#import "lib/planner-sections.typ": rule-line

#let mode = sys.inputs.at("mode", default: "dated")
#let dated = mode == "dated"
#let year = int(sys.inputs.at("year", default: "2027"))
#let period = if dated { str(year) } else { "Edição atemporal" }
#let data = json("data/weeks-" + if dated { str(year) + ".json" } else { "undated.json" })
#let name = sys.inputs.at("personalization_name", default: "")
#let has-logo = "logo" in sys.inputs
#let ink = rgb(sys.inputs.at("primary", default: "#253638"))
#let leaf = rgb(sys.inputs.at("secondary", default: "#385E58"))
#let clay = rgb(sys.inputs.at("accent", default: "#A75539"))
#let pale = color.mix((leaf, 8%), (white, 92%))
#let rule = color.mix((leaf, 42%), (white, 58%))
#let heading = "DM Serif Display"
#let weekdays = ("Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom")

#set document(title: "Combo Planner", author: "678 Estudio")
#set text(lang: "pt", region: "BR", font: "DM Sans 9pt", size: 9pt, fill: ink)
#set par(leading: 0.55em)
#set block(spacing: 0pt)
#set page(
  paper: "a5",
  margin: (inside: 20mm, outside: 12mm, top: 14mm, bottom: 15mm),
  background: if has-logo and "watermark" in sys.inputs {
    context if counter(page).get().first() > 1 {
      place(center + horizon, image("logo.png", width: 60mm, height: 60mm, fit: "contain"))
      place(top + left, rect(width: 100%, height: 100%, fill: white.transparentize(7%), stroke: none))
    }
  },
  footer: context grid(columns: (1fr, auto), align: horizon,
    [
      #if has-logo and counter(page).get().first() > 1 [
        #box(baseline: 40%, image("logo.png", width: 11mm, height: 3.8mm, fit: "contain")) #h(2mm)
      ]
      #text(size: 7pt, fill: leaf)[678 Estudio / Combo Planner]
    ],
    text(size: 8pt, fill: ink, counter(page).display("1")),
  ),
)

#let label(body) = text(size: 8pt, weight: "bold", fill: leaf, body)
#let display(body, size: 28pt) = text(font: heading, size: size, body)
#let head(kicker, title) = block(width: 100%, below: 5mm, stack(
  spacing: 1.5mm,
  label(kicker),
  display(title),
  line(length: 100%, stroke: 0.7pt + rule),
))
#let lines(n, height: 6mm) = for _ in range(n) { rule-line((lines: rule), height: height) }
#let field(title, n: 3) = block(width: 100%, above: 2mm, below: 4mm)[#label(title)#lines(n)]
#let ruled-table(headers, columns, n, height: 7mm) = table(
  columns: columns, rows: (7mm,) + (height,) * n,
  stroke: (x, y) => (bottom: 0.42pt + rule),
  fill: (x, y) => if y == 0 { pale },
  inset: (x: 1.6mm, y: 0mm), align: left + horizon,
  ..headers.map(label), ..([ ] ,) * (n * headers.len()),
)
#let month-grid(y, m) = {
  if not dated { return (none,) * 42 }
  let first = datetime(year: y, month: m, day: 1)
  let next = if m == 12 { datetime(year: y + 1, month: 1, day: 1) } else { datetime(year: y, month: m + 1, day: 1) }
  let days = int((next - first).days())
  (none,) * (first.weekday() - 1) + range(1, days + 1) + (none,) * (43 - first.weekday() - days)
}
#let annual(y) = [
  #head("Planejamento anual", if dated { str(y) } else { "Calendário anual" })
  #grid(columns: (1fr,) * 3, column-gutter: 3mm, row-gutter: 4mm,
    ..data.months.map(m => [
      #block(width: 100%, inset: (x: 1mm, y: 1mm), fill: pale)[#label(m.monthName)]
      #grid(columns: (1fr,) * 7, rows: (3.5mm,) * 7, align: center + horizon,
        ..weekdays.map(d => text(size: 5.5pt, fill: leaf, d.slice(0, 1))),
        ..month-grid(y, m.monthNumber).map(d => if d != none { text(size: 6.8pt, str(d)) } else if not dated {
          line(length: 2mm, stroke: 0.4pt + rule)
        }),
      )
    ])
  )
]
#let quarter(i) = [
  #head("Planejamento anual", str(i + 1) + "º trimestre")
  #for m in data.months.slice(i * 3, i * 3 + 3) [
    #block(width: 100%, inset: 2mm, fill: pale)[#label(m.monthName)]
    #grid(columns: (1fr, 1fr), gutter: 5mm, field("Marcos e compromissos", n: 5), field("Próximos passos", n: 5))
  ]
]
#let monthly(m, start, count, title) = {
  let cells = month-grid(year, m.monthNumber)
  let entries = range(6).map(w => cells.slice(w * 7 + start, w * 7 + start + count)).flatten()
  [#head(m.monthName, title)]
  table(columns: (1fr,) * count, rows: (7mm,) + (18mm,) * 6,
    stroke: 0.45pt + rule, fill: (_, y) => if y == 0 { pale }, inset: 2mm,
    ..weekdays.slice(start, start + count).map(label),
    ..entries.map(d => if d != none { text(weight: "bold", fill: leaf, str(d)) } else if not dated { line(length: 5mm, stroke: 0.4pt + rule) }),
  )
  field(if start == 0 { "Prioridades do mês" } else { "Lembretes" }, n: 3)
}
#let track(m, sleep: false) = [
  #head(m.monthName, if sleep { "Registro de sono" } else { "Hábitos" })
  #let keys = if sleep { ("4h", "5h", "6h", "7h", "8h", "9h", "10h+") } else { ("A", "B", "C", "D", "E", "F", "G") }
  #let days = if dated { month-grid(year, m.monthNumber).filter(d => d != none).len() } else { 31 }
  #table(columns: (12mm,) + (1fr,) * 7, rows: (6mm,) + (3.75mm,) * days,
    stroke: 0.45pt + rule, fill: (x, y) => if y == 0 or x == 0 { pale },
    align: center + horizon, inset: 0pt,
    label("Dia"), ..keys.map(label),
    ..range(1, days + 1).map(d => (text(size: 7pt, str(d)),) + (none,) * 7).flatten(),
  )
  #v(2mm)
  #if sleep {
    field("O que ajudou meu descanso", n: 3)
  } else {
    grid(columns: (1fr, 1fr), column-gutter: 4mm, row-gutter: 1mm,
      ..keys.map(k => grid(columns: (4mm, 1fr), align: horizon, label(k), lines(1, height: 4mm))),
    )
  }
]
#let week-page(m, week, days) = [
  #head(m.monthName, "Semana " + str(week.weekNumber))
  #for day in days [
    #block(width: 100%, below: 3mm)[
      #grid(columns: (1fr, auto), inset: (x: 2mm, y: 1mm), fill: pale,
        label(day.weekday),
        label(if dated { str(day.day) + " " + day.monthShort } else { "__ / __" }),
      )
      #lines(if days.len() == 3 { 5 } else { 4 }, height: 5.8mm)
    ]
  ]
  #field(if days.len() == 3 { "Prioridades da semana" } else { "Notas da semana" }, n: 3)
]

#head(period, "Combo Planner")
#v(7mm)
#if has-logo [
  #image("logo.png", width: 48mm, height: 20mm, fit: "contain")
  #v(5mm)
]
#label("Este planner pertence a")
#if name != "" [#display(name, size: 20pt)]
#lines(1)
#v(8mm)
#field("Telefone", n: 1)
#field("E-mail", n: 1)
#field("Contato de emergência", n: 1)
#v(3mm)
#field("Minha intenção para o ano", n: 5)
#pagebreak()
#annual(year)
#pagebreak()
#if dated { annual(year + 1) } else [
  #head("Planejamento anual", "Metas e direções")
  #field("Pessoal", n: 5)
  #field("Profissional", n: 5)
  #field("Próximos passos", n: 5)
]
#pagebreak()
#for i in range(4) [
  #quarter(i)
  #pagebreak()
]
#head("Planejamento financeiro", "Desafio de economia")
#field("Meta anual", n: 2)
#ruled-table(("Mês", "Meta", "Depósito", "Saldo"), (1.2fr, 1fr, 1fr, 1fr), 0)
#table(columns: (1.2fr, 1fr, 1fr, 1fr), rows: (8mm,) * 12, stroke: (_, _) => (bottom: 0.42pt + rule),
  align: left + horizon, inset: (x: 1.6mm, y: 0mm),
  ..data.months.map(m => (m.monthName, none, none, none)).flatten(),
)
#pagebreak()
#head("Planejamento financeiro", "Panorama anual")
#table(columns: (1.2fr, 1fr, 1fr, 1fr), rows: (8mm,) * 13, stroke: 0.45pt + rule,
  fill: (_, y) => if y == 0 { pale }, inset: (x: 1.6mm, y: 0mm), align: left + horizon,
  ..("Mês", "Entradas", "Saídas", "Saldo").map(label),
  ..data.months.map(m => (m.monthName, none, none, none)).flatten(),
)
#field("Categorias para acompanhar", n: 5)
#pagebreak()
#head("Bem-estar", "Meu ano em cores")
#table(columns: (9mm,) + (1fr,) * 12, rows: (5.5mm,) + (4mm,) * 31, stroke: 0.4pt + rule,
  inset: 0pt, align: center + horizon, fill: (x, y) => if x == 0 or y == 0 { pale },
  label("Dia"), ..data.months.map(m => text(size: 6pt, if dated { m.monthName.slice(0, 3) } else { str(m.monthNumber) })),
  ..range(1, 32).map(d => (text(size: 7pt, str(d)),) + data.months.map(m =>
    if dated and not month-grid(year, m.monthNumber).contains(d) { text(size: 6pt, fill: leaf, "–") }
  )).flatten(),
)
#field("Legenda de cores", n: 2)
#pagebreak()

#for m in data.months [
  #v(24mm)
  #line(length: 22mm, stroke: 2pt + clay)
  #v(7mm)
  #label(period)
  #v(2mm)
  #display(m.monthName, size: 44pt)
  #v(13mm)
  #field("Qual é o meu foco neste mês?", n: 4)
  #field("O que quero reservar tempo para fazer?", n: 4)
  #pagebreak()
  #monthly(m, 0, 4, "Calendário mensal")
  #pagebreak()
  #monthly(m, 4, 3, "Calendário mensal")
  #pagebreak()
  #head(m.monthName, "Checklist")
  #grid(columns: (1fr, 1fr), gutter: 5mm,
    ..("Prioridades", "Para lembrar").map(title => [
      #label(title)
      #for _ in range(16) [
        #grid(columns: (3mm, 1fr), gutter: 2mm, align: horizon,
          rect(width: 2.7mm, height: 2.7mm, stroke: 0.5pt + leaf), lines(1, height: 6mm))
      ]
    ])
  )
  #field("Compromissos importantes", n: 5)
  #pagebreak()
  #head(m.monthName, "Autoavaliação")
  #label("Marque de 1 a 10 para cada área")
  #v(3mm)
  #table(columns: (32mm,) + (1fr,) * 10, rows: (7mm,) + (8mm,) * 8,
    stroke: 0.45pt + rule, fill: (x, y) => if x == 0 or y == 0 { pale },
    inset: 1mm, align: center + horizon, none, ..range(1, 11).map(n => label(str(n))),
    ..("Saúde", "Descanso", "Relações", "Trabalho", "Finanças", "Lazer", "Aprendizado", "Ambiente")
      .map(area => (label(area),) + (none,) * 10).flatten(),
  )
  #field("O que pede mais atenção?", n: 5)
  #field("Uma ação que posso tomar", n: 4)
  #pagebreak()
  #track(m)
  #pagebreak()
  #track(m, sleep: true)
  #pagebreak()
  #for title in ("Entradas", "Saídas", "Cartão 1", "Cartão 2") [
    #head(m.monthName + " / Finanças", title)
    #ruled-table(("Dia", "Descrição", if title.starts-with("Cartão") { "Parcela" } else { "Categoria" }, "Valor"),
      (12mm, 1fr, 25mm, 21mm), 17)
    #field("Total", n: 2)
    #pagebreak()
  ]
  #head(m.monthName + " / Finanças", "Balanço mensal")
  #grid(columns: (1fr, 1fr), gutter: 4mm,
    ..("Entradas", "Despesas", "Economia", "Saldo final").map(title => block(width: 100%, inset: 3mm, fill: pale)[
      #label(title)#lines(1)
    ])
  )
  #v(4mm)
  #ruled-table(("Categoria", "Previsto", "Realizado"), (2fr, 1fr, 1fr), 9)
  #field("Ajustes para o próximo mês", n: 4)
  #pagebreak()
  #head(m.monthName, "Notas")
  #lines(24)
  #pagebreak()
  #for week in m.weeks [
    #week-page(m, week, week.leftDays)
    #pagebreak()
    #week-page(m, week, week.rightDays)
    #pagebreak()
  ]
  #head(m.monthName, "Revisão do mês")
  #field("O que funcionou?", n: 6)
  #field("O que aprendi?", n: 6)
  #field("O que quero fazer de outro jeito?", n: 6)
  #pagebreak()
  #head(m.monthName, "Próximos passos")
  #field("Manter", n: 5)
  #field("Começar", n: 5)
  #field("Deixar para depois", n: 5)
  #pagebreak()
  #head(m.monthName, "Ideias e anotações")
  #lines(24)
  #pagebreak()
]

#head("Bem-estar", "Atividade ao longo do ano")
#ruled-table(("Mês", "Atividades", "Frequência"), (22mm, 1fr, 24mm), 0)
#table(columns: (22mm, 1fr, 24mm), rows: (8mm,) * 12, stroke: (_, _) => (bottom: 0.42pt + rule),
  align: left + horizon, inset: (x: 1.6mm, y: 0mm),
  ..data.months.map(m => (m.monthName, none, none)).flatten(),
)
#field("Anotações", n: 4)
#pagebreak()
#head("Bem-estar", "Registro de ciclo")
#table(columns: (12mm,) + (1fr,) * 12, rows: (5.5mm,) + (4mm,) * 31, stroke: 0.4pt + rule,
  inset: 0pt, align: center + horizon, fill: (x, y) => if x == 0 or y == 0 { pale },
  label("Dia"), ..data.months.map(m => text(size: 6pt, str(m.monthNumber))),
  ..range(1, 32).map(d => (text(size: 7pt, str(d)),) + (none,) * 12).flatten(),
)
#field("Legenda", n: 2)
#pagebreak()
#for title in ("Livros", "Séries", "Filmes", "Playlist") [
  #head("Registros culturais", title)
  #ruled-table((if title == "Playlist" { "Faixa / artista" } else { "Título" }, "Data", "Impressões"), (2fr, 1fr, 1.5fr), 16)
  #field("Para lembrar", n: 4)
  #pagebreak()
]
#head("Fechamento", "Retrospectiva do ano")
#field("O que quero celebrar", n: 7)
#field("O que levo comigo", n: 7)
#field("O que quero cultivar no próximo ano", n: 6)
#pagebreak()
#head("Fechamento", "Notas finais")
#lines(24)

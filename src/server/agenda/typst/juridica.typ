#import "lib/sections.typ": annual-calendar, ruled
#import "lib/style.typ": agenda-styles

#let year = int(sys.inputs.at("year"))
#let ink = rgb(sys.inputs.at("primary"))
#let accent = rgb(sys.inputs.at("secondary"))
#let tint = if "tint" in sys.inputs { rgb(sys.inputs.at("tint")) } else { color.mix((white, 80%), (accent, 20%)) }
#let dates = json(bytes(sys.inputs.at("dates", default: "[]")))
#let rule = rgb("#777777") + 0.35pt
#let style = agenda-styles.classic
#let colors = (primary: ink, secondary: accent, writing-lines: rgb("#777777"))
#let months = ("Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro")
#let weekdays = ("Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo")
#let pad(number) = if number < 10 { "0" + str(number) } else { str(number) }
#let date-label(date) = pad(date.day) + "/" + pad(date.month) + " · " + date.name
#let date-name(date) = {
  let matches = dates.filter(d => (d.year, d.month, d.day) == (date.year(), date.month(), date.day()))
  if matches.len() > 0 { matches.first().name }
}

#set document(title: "Agenda Jurídica " + str(year), author: "678 Estudio")
#set text(lang: "pt", region: "BR", font: style.font-sans, size: 8pt, fill: ink)
#set page(
  width: 148mm, height: 210mm,
  margin: (inside: 15mm, outside: 6mm, top: 6mm, bottom: 6mm),
  background: if "watermark" in sys.inputs {
    place(center + horizon, rotate(-22deg, image("logo.png", width: 60mm, height: 60mm, fit: "contain")))
    place(top + left, rect(width: 100%, height: 100%, fill: white.transparentize(13%), stroke: none))
  },
  footer: if "logo" in sys.inputs { align(center, image("logo.png", width: 22mm, height: 4mm, fit: "contain")) },
)
#set block(above: 0pt, below: 0pt)

#let title(body, size: 13pt) = text(font: style.font-display, size: size, weight: "bold", body)
#let heading(body) = [
  #align(center, title(body))
  #rect(width: 100%, height: 2mm, fill: tint, stroke: none)
  #v(2mm)
]
#let band(body) = block(width: 100%, fill: tint, inset: 0.8mm, align(center, body))
#let row(body, height: 5mm) = block(width: 100%, height: height, inset: (x: 1mm, top: 1mm), stroke: (bottom: rule), body)
#let panel(height) = rect(width: 100%, height: height, fill: tint, stroke: none)
#let fields(labels, height: 5mm) = {
  for label in labels {
    row(if type(label) == array { grid(columns: (1fr, 1fr), ..label) } else { label }, height: height)
  }
}

#let scales = box(width: 18mm, height: 13mm)[
  #let beam = ink + 0.55pt
  #place(line(start: (9mm, 0mm), end: (9mm, 11mm), stroke: ink + 1pt))
  #place(line(start: (7mm, 11mm), end: (11mm, 11mm), stroke: ink + 1pt))
  #place(line(start: (3mm, 3mm), end: (15mm, 3mm), stroke: beam))
  #for x in (3mm, 15mm) {
    place(line(start: (x, 3mm), end: (x - 2mm, 8mm), stroke: beam))
    place(line(start: (x, 3mm), end: (x + 2mm, 8mm), stroke: beam))
    place(dx: x - 2mm, dy: 8mm, rect(width: 4mm, height: 1.5mm, radius: (bottom: 1mm), fill: ink, stroke: none))
  }
]

#align(center)[
  #v(36mm)
  #scales
  #linebreak()
  #title([AGENDA], size: 24pt)
  #linebreak()
  #text(font: "Caveat", size: 26pt)[Jurídica]
  #v(21mm)
  Pertence a:
  #panel(6mm)
  #v(25mm)
  #panel(51mm)
]
#pagebreak()

#heading([Dados Pessoais])
#fields(("Nome:", ("CPF:", "RG:"), ("Título de Eleitor:", "Nascimento:"), ("CNH:", "Validade:"), "Endereço:", ("Bairro:", "Cidade:"), ("Estado:", "CEP:"), ("Celular:", "E-mail:"), "Banco(s):", "Agência(s):", "Conta(s):", "Contato(s):"))
#v(2mm)
#band(title([Dados do Escritório], size: 10pt))
#fields(("Nome:", "Endereço:", ("Bairro:", "Cidade:"), ("Estado:", "CEP:"), "Contatos:", "Redes Sociais:"))
#v(2mm)
#band([Em caso de emergência, avisar:])
#fields((("Nome:", "Telefone:"), ("Nome:", "Telefone:")))
#v(2mm)
#band([Telefones úteis])
#align(center)[181 · Denúncia   #h(3mm) 190 · Polícia Militar   #h(3mm) 192 · SAMU]
#align(center)[193 · Bombeiros   #h(3mm) 199 · Defesa Civil   #h(3mm) 100 · Direitos Humanos]
#pagebreak()

#for calendar-year in (year, year + 1) {
  annual-calendar(calendar-year, months, colors, style)
  v(4mm)
  band([Feriados e datas comemorativas])
  set text(size: 7pt)
  grid(columns: (1fr, 1fr, 1fr), row-gutter: 0.9mm, ..dates.filter(d => d.year == calendar-year).map(date-label))
  v(4mm)
  band([Feriados municipais e estaduais])
  ruled(5, colors)
  pagebreak()
}

#for _ in range(2) {
  heading([Objetivos e Metas para #year])
  for _ in range(3) {
    band([Objetivo:])
    grid(columns: (1fr, 1fr), gutter: 1mm, ..range(2).map(_ => [
      #align(center)[Metas:]
      #ruled(6, colors, spacing: 7mm)
    ]))
    grid(columns: (1fr, 1fr), gutter: 1mm, band([Início:]), band([Término:]))
    v(3mm)
  }
  pagebreak()
}

#for _ in range(2) {
  heading([Contatos Importantes])
  grid(columns: (1fr, 1fr), gutter: 3mm, ..range(12).map(_ => [
    #band([ ])
    #ruled(3, colors, spacing: 6mm)
  ]))
  pagebreak()
}

#heading([Logins e Senhas])
#for _ in range(12) {
  band([Site:])
  fields((("Login:", "Senha:"),))
  v(2mm)
}
#pagebreak()

#for group in range(0, 12, step: 4) {
  heading([Planejamento Anual])
  grid(columns: (1fr, 1fr), gutter: 4mm, ..months.slice(group, group + 4).map(month => [
    #band(month)
    #let number = months.position(item => item == month) + 1
    #let labels = dates.filter(d => d.year == year and d.month == number)
    #ruled(12 - labels.len(), colors, spacing: 6.6mm)
    #fields(labels.map(date-label), height: 6.6mm)
  ]))
  pagebreak()
}

#let monthly-calendar(first, count, name) = {
  let offset = calc.rem(first.weekday(), 7)
  let weeks = int(calc.ceil((offset + count) / 7))
  heading(name)
  table(
    columns: (1fr,) * 7,
    stroke: rule,
    inset: 1mm,
    align: center,
    fill: (x, y) => if y == 0 or x == 0 or x == 6 { tint },
    ..("Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"),
    ..range(weeks * 7).map(i => {
      let day = i - offset + 1
      box(width: 100%, height: 124mm / weeks, if day >= 1 and day <= count {
        align(right, str(day))
        place(bottom + left, text(size: 5pt, date-name(datetime(year: year, month: first.month(), day: day))))
      })
    }),
  )
  v(2mm)
  band([Lembretes])
  grid(columns: (1fr, 1fr), gutter: 3mm, ruled(3, colors, spacing: 5mm), ruled(3, colors, spacing: 5mm))
  v(2mm)
  band([Anotações])
  panel(12mm)
}

#let monthly-priorities(name) = {
  heading(name)
  band([Prioridades do Mês])
  grid(columns: (1fr, 1fr), gutter: 4mm, ruled(9, colors), ruled(9, colors))
  v(3mm)
  band([Datas Importantes])
  v(3mm)
  grid(columns: (1fr, 1fr), gutter: 2mm, ..range(12).map(_ =>
    rect(width: 100%, height: 7mm, radius: 3mm, stroke: tint + 0.8pt)
  ))
  v(4mm)
  band([Anotações])
  panel(37mm)
}

#let daily(date, name) = context {
  let number = title(pad(date.day()), size: 37pt)
  let weekday = weekdays.at(date.weekday() - 1)
  let verso = calc.rem(counter(page).get().first(), 2) == 0
  grid(columns: (auto, 1fr, auto), align: bottom, column-gutter: 1mm,
    if verso { number } else { title(name) },
    align(if verso { left } else { right }, weekday),
    if verso { title(name) } else { number },
  )
  panel(1.5mm)
  block(height: 7mm, if date-name(date) != none { text(size: 8pt, date-name(date)) })
  table(
    columns: (15mm, 1fr),
    stroke: (x: none, y: rule),
    inset: 0pt,
    fill: (_, y) => if y == 0 { tint },
    align: center,
    table.vline(x: 1, stroke: rule),
    box(height: 7mm, align(horizon)[Horário]), box(height: 7mm, align(horizon)[Compromissos]),
    ..range(24).map(_ => box(height: 7mm)),
  )
  v(2mm)
  band([Audiências])
  v(2mm)
  grid(columns: (1fr, 1fr), gutter: 1.5mm, ..range(4).map(_ =>
    block(width: 100%, inset: 1.6mm, radius: 2.5mm, stroke: tint + 0.8pt)[
      #fields(("Hora:", "Vara:", "Autor:", "Réu:", "Processo:", "Telefone:"), height: 5.45mm)
    ]
  ))
}

#let notes() = {
  heading([Anotações])
  ruled(27, colors, spacing: 6.6mm)
}

#let finance-table(headers, columns, total, marks: ()) = table(
  columns: columns,
  stroke: rule,
  inset: 0.5mm,
  align: center + horizon,
  fill: (_, y) => if y == 0 or y == 30 { tint },
  ..headers,
  ..range(29).map(_ => range(headers.len()).map(i => box(
    height: 4.25mm,
    if i in marks { circle(radius: 1.4mm, fill: tint, stroke: none) },
  ))).flatten(),
  table.cell(colspan: headers.len(), align: left, total),
)

#let finance() = {
  heading([Controle Financeiro Mensal])
  set text(size: 7pt)
  grid(columns: (1fr, 1fr), gutter: 1.5mm,
    [
      #align(center)[Entrada]
      #finance-table(("Data", "Descrição", "Valor"), (1fr, 3fr, 2fr), [Total de Entradas:])
    ],
    [
      #align(center)[Gastos Fixos]
      #finance-table(("Data", "Descrição", "Valor", "Pago"), (1fr, 3fr, 2fr, 1fr), [Total de Gastos Fixos:], marks: (3,))
    ],
  )
  pagebreak()
  heading([Controle Financeiro Mensal])
  band([Gastos Variáveis])
  finance-table(
    ("Data", "Descrição", "Valor", "Dinheiro", "Débito", "Crédito", "Parcelas", "Outros"),
    (1fr, 2fr, 2fr, 1fr, 1fr, 1fr, 2fr, 1fr),
    [Total de Gastos Variáveis:],
    marks: (3, 4, 5),
  )
  v(2mm)
  band(title([Resultado do Mês], size: 10pt))
  grid(columns: (1fr,) * 4, gutter: 2mm, ..("Saldo Anterior", "Total de Entradas", "Total de Saídas", "Saldo do Mês").map(label => [
    #align(center, label)
    #rect(width: 100%, height: 5mm, stroke: tint + 0.8pt)
  ]))
}

#for month in range(1, 13) {
  let name = months.at(month - 1)
  let first = datetime(year: year, month: month, day: 1)
  let next = if month == 12 { datetime(year: year + 1, month: 1, day: 1) } else { datetime(year: year, month: month + 1, day: 1) }
  let count = int((next - first).days())
  monthly-calendar(first, count, name)
  pagebreak()
  monthly-priorities(name)
  pagebreak()
  for day in range(count) {
    daily(first + duration(days: day), name)
    pagebreak()
  }
  if "finance" in sys.inputs {
    finance()
    pagebreak()
  }
  if month < 12 and calc.rem(count, 2) == 1 {
    notes()
    pagebreak()
  }
}

#notes()

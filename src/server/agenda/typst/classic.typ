// Agenda Clássica (v2) — 678 Estudio
// Ciclos mensais completos (Planejamento + Compromissos + Controle Financeiro),
// Cadastro de Contatos, Anotações, Calendário do Ano Seguinte e Página Institucional.

#import "lib/daily.typ": daily-1dpp, daily-2dpp
#import "lib/weekly.typ": weekly-horizontal
#import "lib/style.typ": agenda-styles, default-colors, rule-color
#import "lib/sections.typ": opening, annual-calendar, personal-data, monthly-plan, monthly-finance, contacts-page, notes, studio-colophon

#let year = int(sys.inputs.at("year", default: "2026"))
#let agenda-layout = sys.inputs.at("layout", default: "daily-1dpp")
#let style = agenda-styles.at(sys.inputs.at("style", default: "classic"))
#let primary = rgb(sys.inputs.at("primary", default: "#1f2937"))
#let secondary = rgb(sys.inputs.at("secondary", default: "#2563eb"))
#let custom-colors = "custom-colors" in sys.inputs
#let tint = color.mix((white, 78%), (secondary, 22%))
#let colors = (
  primary: primary,
  secondary: secondary,
  lines: if style.id == "classic" and not custom-colors { default-colors.lines } else { tint },
  writing-lines: if style.id == "classic" and not custom-colors { rule-color } else { tint },
)
#let has-logo = "logo" in sys.inputs
#let has-watermark = "watermark" in sys.inputs
#let studio-info = (
  instagram: sys.inputs.at("studio-instagram", default: "@678estudio"),
  site: sys.inputs.at("studio-site", default: ""),
  whatsapp: sys.inputs.at("studio-whatsapp", default: ""),
  email: sys.inputs.at("studio-email", default: ""),
)
#let title = "Agenda Clássica " + str(year)

#set document(title: title, author: "678 Estudio")
#set text(lang: "pt", region: "BR", font: style.font-sans, size: style.body, fill: colors.primary)
#set page(
  paper: sys.inputs.at("format", default: "a5"),
  margin: (top: 12mm, bottom: 12mm, inside: 17mm, outside: 11mm),
  background: if has-watermark [
    #place(center + horizon, rotate(-22deg, image("logo.png", width: 60mm, height: 60mm, fit: "contain")))
    #place(top + left, rect(width: 100%, height: 100%, fill: white.transparentize(13%), stroke: none))
  ],
  footer: context grid(
    columns: (1fr, auto),
    align: horizon,
    if has-logo { image("logo.png", width: 22mm, height: 5mm, fit: "contain") },
    text(size: 7pt, fill: colors.primary, [#title #h(5pt) · #h(5pt) #counter(page).display()]),
  ),
)
#set par(leading: 0.55em)

#let months = (
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
)
#let weekdays = (
  "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira",
  "Sexta-feira", "Sábado", "Domingo",
)

#let start = datetime(year: year, month: 1, day: 1)
#let end = datetime(year: year + 1, month: 1, day: 1)
#let day-count = int((end - start).days())
#let date-at(offset) = start + duration(days: offset)
#let day-info(date) = (
  day: date.day(),
  month: date.month(),
  month_name: months.at(date.month() - 1),
  weekday: date.weekday(),
  weekday_name: weekdays.at(date.weekday() - 1),
  is_weekend: date.weekday() >= 6,
)

#let month-bounds(m) = {
  let m-start = datetime(year: year, month: m, day: 1)
  let m-end = if m == 12 { end } else { datetime(year: year, month: m + 1, day: 1) }
  (
    start-offset: int((m-start - start).days()),
    count: int((m-end - m-start).days()),
  )
}

#if has-logo { place(top + right, image("logo.png", width: 26mm, height: 12mm, fit: "contain")) }
#opening(year, colors, style)
#pagebreak()
#annual-calendar(year, months, colors, style)
#pagebreak()
#personal-data(colors, style)
#pagebreak()

#let first-week-offset = 1 - start.weekday()
#let all-week-offsets = range(first-week-offset, day-count, step: 7)
#let total-weeks = all-week-offsets.len()

#for month in range(1, 13) {
  let m-name = months.at(month - 1)
  let bounds = month-bounds(month)
  monthly-plan(year, month, m-name, colors, style)
  pagebreak()

  if agenda-layout == "daily-1dpp" {
    for d in range(bounds.count) {
      daily-1dpp(day-info(date-at(bounds.start-offset + d)), colors: colors, style: style)
      pagebreak(weak: true)
    }
  } else if agenda-layout == "daily-2dpp" {
    for d in range(0, bounds.count, step: 2) {
      let left-day = day-info(date-at(bounds.start-offset + d))
      let right-day = if d + 1 < bounds.count { day-info(date-at(bounds.start-offset + d + 1)) } else { none }
      daily-2dpp(left-day, right-day, colors: colors, style: style)
      pagebreak(weak: true)
    }
  } else if agenda-layout == "weekly" {
    for (week-idx, offset) in all-week-offsets.enumerate() {
      let first-in-year = date-at(calc.max(offset, 0))
      if first-in-year.month() == month {
        let last-in-year = date-at(calc.min(offset + 6, day-count - 1))
        let days = range(offset, offset + 7).map(i => {
          if i < 0 or i >= day-count { return (:) }
          let info = day-info(date-at(i))
          (name: info.weekday_name, day: info.day, month_name: info.month_name)
        })
        weekly-horizontal((
          week: week-idx + 1,
          range_str: first-in-year.display("[day]/[month]") + " a " + last-in-year.display("[day]/[month]"),
          days: days,
        ), colors: colors, style: style)
        pagebreak(weak: true)
      }
    }
  } else {
    panic("Layout desconhecido")
  }

  monthly-finance(m-name, year, colors, style)
  pagebreak()
}

#for _ in range(4) {
  contacts-page(colors, style)
  pagebreak()
}

#let notes-count = if agenda-layout == "daily-1dpp" {
  367 - day-count
} else if agenda-layout == "daily-2dpp" {
  let commitment-pages = range(1, 13).map(m => calc.ceil(month-bounds(m).count / 2)).sum()
  189 - commitment-pages
} else {
  57 - total-weeks
}

#for _ in range(notes-count) {
  notes(colors, style)
  pagebreak()
}

#annual-calendar(year + 1, months, colors, style, subtitle: "Planejamento prévio do ano seguinte")
#pagebreak()
#studio-colophon(studio-info, colors, style)

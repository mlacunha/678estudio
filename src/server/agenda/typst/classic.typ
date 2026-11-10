#import "lib/daily.typ": daily-1dpp, daily-2dpp
#import "lib/weekly.typ": weekly-horizontal
#import "lib/style.typ": agenda-styles, default-colors, rule-color

#let year = int(sys.inputs.at("year"))
#let agenda-layout = sys.inputs.at("layout")
#let style = agenda-styles.at(sys.inputs.at("style", default: "classic"))
#let primary = rgb(sys.inputs.at("primary", default: "#1f2937"))
#let secondary = rgb(sys.inputs.at("secondary", default: "#2563eb"))
#let custom-colors = "custom-colors" in sys.inputs
#let tint = color.mix((white, 78%), (secondary, 22%))
#let colors = (
  primary: primary, secondary: secondary,
  lines: if style.id == "classic" and not custom-colors { default-colors.lines } else { tint },
  writing-lines: if style.id == "classic" and not custom-colors { rule-color } else { tint },
)
#let has-logo = "logo" in sys.inputs
#let has-watermark = "watermark" in sys.inputs
#let preview-limit = int(sys.inputs.at("preview-limit", default: "366"))
#let title = "Agenda Clássica " + str(year)
#set document(title: title, author: "678 Estudio")
#set text(lang: "pt", region: "BR", font: style.font-sans, size: style.body)
#set page(
  paper: sys.inputs.at("format", default: "a5"),
  margin: (top: 12mm, bottom: 12mm, inside: 17mm, outside: 11mm),
  background: if has-watermark [
    #place(center + horizon, rotate(-22deg, image("logo.png", width: 60mm, height: 60mm, fit: "contain")))
    #place(top + left, rect(width: 100%, height: 100%, fill: white.transparentize(13%), stroke: none))
  ],
  footer: context grid(
    columns: (1fr, auto), align: horizon,
    if has-logo { image("logo.png", width: 22mm, height: 5mm, fit: "contain") },
    text(size: 7pt, fill: colors.primary, [#title #h(5pt) · #h(5pt) #counter(page).display()]),
  ),
)

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
  month_name: months.at(date.month() - 1),
  weekday_name: weekdays.at(date.weekday() - 1),
  is_weekend: date.weekday() >= 6,
)

#if agenda-layout == "daily-1dpp" {
  for i in range(calc.min(day-count, preview-limit)) {
    daily-1dpp(day-info(date-at(i)), colors: colors, style: style)
    pagebreak(weak: true)
  }
} else if agenda-layout == "daily-2dpp" {
  for i in range(0, calc.min(day-count, preview-limit * 2), step: 2) {
    let right-day = if i + 1 < day-count { day-info(date-at(i + 1)) }
    daily-2dpp(day-info(date-at(i)), right-day, colors: colors, style: style)
    pagebreak(weak: true)
  }
} else if agenda-layout == "weekly" {
  // Semanas de segunda a domingo. As datas de outros anos ficam em branco.
  let first-offset = 1 - start.weekday()
  for (week, offset) in range(first-offset, calc.min(day-count, first-offset + preview-limit * 7), step: 7).enumerate() {
    let first = date-at(calc.max(offset, 0))
    let last = date-at(calc.min(offset + 6, day-count - 1))
    let days = range(offset, offset + 7).map(i => {
      if i < 0 or i >= day-count { return (:) }
      let info = day-info(date-at(i))
      (name: info.weekday_name, day: info.day, month_name: info.month_name)
    })
    weekly-horizontal((
      week: week + 1,
      range_str: first.display("[day]/[month]") + " a " + last.display("[day]/[month]"),
      days: days,
    ), colors: colors, style: style)
    pagebreak(weak: true)
  }
} else {
  panic("Layout desconhecido")
}

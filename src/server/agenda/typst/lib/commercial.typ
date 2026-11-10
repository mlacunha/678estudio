#let dot-grid(cols, rows: 4, dot-size: 1.05pt, gap: 1.5pt, fill: black) = {
  let cells = ()
  for _ in range(rows * cols) {
    cells.push(box(width: dot-size, height: dot-size, fill: fill))
  }
  grid(
    columns: (dot-size,) * cols,
    row-gutter: gap,
    column-gutter: gap,
    ..cells,
  )
}

#let dot-band(cols: 22, rows: 4, fill: black) = dot-grid(cols, rows: rows, fill: fill)

#let _day-padded(n) = {
  let s = str(n)
  if s.len() < 2 { "0" + s } else { s }
}

/// Cabeçalho diário comercial: 05 | JANEIRO / SEGUNDA-FEIRA | faixa de pontos.
#let commercial-day-header(day, colors, style, compact: false) = {
  let day-num = _day-padded(day.at("day", default: 1))
  let month = upper(day.at("month_name", default: "Janeiro"))
  let weekday = upper(day.at("weekday_name", default: ""))
  let holiday = day.at("holiday_name", default: none)

  grid(
    columns: (auto, 0.35pt, auto, 1fr),
    column-gutter: if compact { 4pt } else { 7pt },
    align: horizon,
    text(
      font: style.font-sans,
      size: if compact { 26pt } else { 38pt },
      weight: "bold",
      fill: colors.primary,
      day-num,
    ),
    line(length: 12mm, angle: 90deg, stroke: style.stroke-rule + colors.primary),
    stack(
      spacing: 2pt,
      text(font: style.font-sans, size: 8pt, weight: "bold", tracking: 0.12em, fill: colors.primary, month),
      text(font: style.font-sans, size: 7.5pt, weight: "regular", tracking: 0.08em, fill: colors.primary, weekday),
      if holiday != none {
        text(font: style.font-sans, size: 6.5pt, fill: colors.primary.lighten(20%), holiday)
      },
    ),
    align(right + horizon, dot-band(cols: if compact { 5 } else { 18 }, rows: 4, fill: colors.primary)),
  )
}

#let commercial-notes-box(colors, style, label: "Anotações") = {
  block(
    width: 100%,
    height: 100%,
    stroke: style.stroke-rule + colors.primary,
    inset: (x: 8pt, y: 10pt, top: 12pt),
    place(
      top + left,
      dx: 8pt,
      dy: -7pt,
      block(fill: white, inset: (x: 4pt),
        text(font: style.font-sans, size: 7pt, weight: "regular", tracking: 0.1em, fill: colors.primary, upper(label)),
      ),
    ),
  )
}

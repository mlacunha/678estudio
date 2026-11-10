#import "style.typ": default-colors, classic-style, soft-panel
#import "commercial.typ": commercial-day-header, commercial-notes-box
#import "feminine.typ": feminine-hearts

#let _day-padded(n) = {
  let s = str(n)
  if s.len() < 2 { "0" + s } else { s }
}

#let _time-label(hour, minute) = {
  let hh = if hour < 10 { "0" + str(hour) } else { str(hour) }
  let mm = if minute == 0 { "00" } else { "30" }
  hh + ":" + mm
}

#let _half-hour-slots(start-hour: 7, end-hour: 19) = {
  let slots = ()
  for h in range(start-hour, end-hour + 1) {
    slots.push((hour: h, minute: 0))
    if h < end-hour {
      slots.push((hour: h, minute: 30))
    }
  }
  slots
}

#let _dotted-rule(colors, style) = line(
  length: 100%,
  stroke: (
    paint: colors.lines,
    thickness: style.stroke-soft,
    dash: (1.5pt, 1.5pt),
  ),
)

#let day-header(day, colors, style, compact: false) = {
  if style.id == "commercial" {
    return commercial-day-header(day, colors, style, compact: compact)
  }
  let day-num = _day-padded(day.at("day", default: 1))
  let month = upper(day.at("month_name", default: "Janeiro"))
  let weekday = day.weekday_name
  let is-weekend = day.is_weekend
  let num-fill = if is-weekend { colors.secondary } else { colors.primary.lighten(12%) }

  grid(
    columns: (auto, 1fr),
    column-gutter: 7pt,
    align: top + left,
    text(
      font: style.font-display,
      size: 34pt,
      weight: "regular",
      fill: num-fill,
      day-num,
    ),
    stack(
      spacing: 2.5pt,
      pad(left: 1pt,
        text(
          font: style.font-sans,
          size: 7.5pt,
          weight: "regular",
          fill: colors.primary.lighten(38%),
          tracking: 0.18em,
          month,
        ),
      ),
      text(
        font: style.font-sans,
        size: 9pt,
        weight: "regular",
        fill: colors.primary.lighten(18%),
        weekday,
      ),
      if style.id == "feminine" { align(left, feminine-hearts(colors)) },
    ),
  )
}

#let schedule(colors, style) = {
  let commercial = style.id == "commercial"
  let slots = if commercial { range(8, 19).map(hour => (hour: hour, minute: 0)) } else { _half-hour-slots() }
  let cells = ()
  for slot in slots {
    cells.push(align(
      left + horizon,
      text(
        font: style.font-sans,
        size: 6.8pt,
        weight: "regular",
        fill: colors.primary.lighten(42%),
        if commercial { str(slot.hour) + "h" } else { _time-label(slot.hour, slot.minute) },
      ),
    ))
    let rule = if commercial { line(length: 100%, stroke: style.stroke-soft + colors.lines) } else { _dotted-rule(colors, style) }
    cells.push(align(horizon + left, rule))
  }
  // A altura fica na célula da grade. Medir com layout() usava a página inteira
  // e a última linha encostava na caixa de anotações.
  block(
    width: 100%,
    height: 100%,
    grid(
      columns: (11mm, 1fr),
      rows: (1fr,) * slots.len(),
      column-gutter: 4pt,
      align: horizon,
      ..cells,
    ),
  )
}

#let daily-notes-panel(colors, style) = {
  if style.id == "commercial" { return commercial-notes-box(colors, style) }
  soft-panel(
    colors,
    inset: (x: 10pt, y: 8pt),
    block(
      width: 100%,
      height: 100%,
      grid(
        rows: (auto, 1fr),
        row-gutter: 6pt,
        align(center, text(
          font: style.font-sans,
          size: style.label,
          weight: "regular",
          fill: colors.primary.lighten(25%),
          "Anotações",
        )),
        [],
      ),
    ),
  )
}

#let day-column(day, colors, style, compact: false) = grid(
  rows: (auto, 1fr),
  row-gutter: 5pt,
  day-header(day, colors, style, compact: compact),
  schedule(colors, style),
)

#let daily-1dpp(day, colors: default-colors, style: classic-style) = block(
  height: 100%,
  width: 100%,
  grid(
    rows: (auto, 8pt, 1fr, 6mm, 0.40fr),
    day-header(day, colors, style),
    [],
    schedule(colors, style),
    [],
    daily-notes-panel(colors, style),
  ),
)

#let daily-2dpp(left-day, right-day, colors: default-colors, style: classic-style) = block(
  height: 100%,
  width: 100%,
  grid(
    rows: (1fr, 6mm, 0.32fr),
    if right-day == none {
      day-column(left-day, colors, style)
    } else {
      grid(
        columns: (1fr, 1fr),
        column-gutter: 11pt,
        day-column(left-day, colors, style, compact: true),
        day-column(right-day, colors, style, compact: true),
      )
    },
    [],
    daily-notes-panel(colors, style),
  ),
)

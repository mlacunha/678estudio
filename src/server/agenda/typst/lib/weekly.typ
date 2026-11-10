#import "style.typ": default-colors, rule-color, classic-style, s-subhead, s-label, s-micro
#import "commercial.typ": dot-band
#import "feminine.typ": feminine-week-header

#let week-title(week-info) = {
  let week-num = week-info.at("week", default: 1)
  let range-str = week-info.at("range_str", default: "")
  "Semana " + str(week-num) + (if range-str != "" { " — " + range-str } else { "" })
}

#let ruled-lines(
  spacing: 7mm,
  line-width: 0.25pt,
  paint: rule-color,
) = layout(size => {
  let n = calc.max(1, int(size.height / spacing))
  let rowh = size.height / n
  grid(
    rows: (rowh,) * n,
    ..range(n).map(i => line(length: 100%, stroke: line-width + paint)),
  )
})

#let week-header(week-info, colors, style) = if style.id == "feminine" {
  feminine-week-header(week-info, colors, style)
} else { grid(
  rows: (auto, auto),
  row-gutter: 3pt,
  if style.id == "commercial" {
    grid(
      columns: (1fr, auto), align: horizon,
      s-subhead(style, upper(week-title(week-info)), fill: colors.primary),
      dot-band(cols: 18, rows: 3, fill: colors.secondary),
    )
  } else { s-subhead(style, week-title(week-info), fill: colors.primary) },
  line(length: 100%, stroke: style.stroke-rule + colors.secondary),
) }

#let hday-row(dinfo, colors, style) = grid(
  columns: (36mm, 1fr),
  column-gutter: 6pt,
  block(
    width: 100%,
    stroke: (right: style.stroke-soft + colors.lines),
    inset: (right: 4pt, y: 2pt),
    align(left + horizon, [
      #s-label(style, dinfo.at("name", default: ""), fill: colors.primary)
      #v(1pt)
      #s-micro(
        style,
        str(dinfo.at("day", default: "")) + " " + dinfo.at("month_name", default: ""),
        fill: colors.secondary,
        size: 7pt,
      )
    ]),
  ),
  ruled-lines(spacing: style.rule-spacing, line-width: style.stroke-soft, paint: colors.at("writing-lines", default: rule-color)),
)

#let weekly-horizontal(week-info, colors: default-colors, style: classic-style) = block(
  height: 100%,
  width: 100%,
  grid(
    rows: (auto, 1fr),
    row-gutter: 5pt,
    week-header(week-info, colors, style),
    grid(
      rows: (1fr,) * 7,
      row-gutter: 2.5mm,
      ..week-info.days.map(day => hday-row(day, colors, style)),
    ),
  ),
)

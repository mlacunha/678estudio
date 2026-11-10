#let feminine-hearts(colors) = align(center)[
  #text(fill: colors.secondary, size: 8.5pt, "♥  ♥  ♥")
]

#let feminine-week-header(week-info, colors, style) = align(center)[
  #feminine-hearts(colors)
  #v(3pt)
  #text(font: style.font-display, size: style.heading, fill: colors.primary, "Semana " + str(week-info.week))
  #v(1pt)
  #text(font: style.font-sans, size: 7pt, fill: colors.secondary, week-info.range_str)
]

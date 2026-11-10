#let default-colors = (
  primary: rgb("#1F2937"),
  secondary: rgb("#2563EB"),
  lines: rgb("#CBD5E1"),
)

// Cor das pautas de escrita (ultra-fina, cinza claro).
#let rule-color = rgb("#E2E8F0")

#let classic-style = (
  id: "classic",
  font-display: "Source Serif 4 Display",
  font-sans: "Source Sans 3",
  subhead: 11pt,
  body: 9pt,
  label: 7.5pt,
  micro: 5.5pt,
  stroke-rule: 0.4pt,
  stroke-soft: 0.25pt,
  rule-spacing: 7mm,
)

#let agenda-styles = (
  classic: classic-style,
  commercial: classic-style + (
    id: "commercial", font-display: "Source Sans 3", stroke-rule: 0.35pt, stroke-soft: 0.25pt,
  ),
  feminine: classic-style + (
    id: "feminine", font-display: "Caveat", heading: 16pt, stroke-rule: 0.35pt,
    stroke-soft: 0.18pt, rule-spacing: 8mm,
  ),
)

#let s-subhead(style, body, fill: auto, size: auto) = text(
  font: style.font-sans,
  size: if size == auto { style.subhead } else { size },
  weight: "bold",
  fill: fill,
  body,
)

#let s-label(style, body, fill: auto, size: auto, weight: "bold") = text(
  font: style.font-sans,
  size: if size == auto { style.label } else { size },
  weight: weight,
  fill: fill,
  tracking: 0.02em,
  body,
)

#let s-micro(style, body, fill: auto, size: auto, weight: "regular") = text(
  font: style.font-sans,
  size: if size == auto { style.micro } else { size },
  weight: weight,
  fill: fill,
  body,
)

#let accent-soft(colors, strength: 22%) = color.mix(
  (white, 100% - strength),
  (colors.secondary, strength),
)

#let panel-fill(colors) = accent-soft(colors, strength: 10%)

#let soft-panel(colors, inset: 8pt, body) = block(
  width: 100%,
  inset: inset,
  fill: panel-fill(colors),
  stroke: (
    paint: colors.lines,
    thickness: 0.45pt,
    dash: "dashed",
  ),
  body,
)

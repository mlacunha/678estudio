#import "shared.typ": *
#import "classic.typ": *
#import "modern.typ": *
#import "photographic.typ": *

// Combined A4 Landscape (297 mm x 210 mm)
// Back cover on Left (148 x 210 mm), Front cover on Right (148 x 210 mm)
// Center cut mark guide for guillotine cutting without folding
#let a4-landscape-width = 297mm
#let a4-landscape-height = 210mm

#let render-combined-a4(style, title, name, subtitle, colors, heading-font, body-font, photo-path) = {
  let half-w = a4-landscape-width / 2 // 148.5 mm
  let zero-bleed-dims = (
    width: a5-width,
    height: a5-height,
    bleed: 0mm,
  )

  // Metade Esquerda: Contracapa
  place(top + left, dx: 0mm, dy: 0mm,
    block(width: half-w, height: a4-landscape-height, clip: true)[
      #if style == "classic" {
        render-classic-back(colors, heading-font, body-font, zero-bleed-dims)
      } else if style == "modern" {
        render-modern-back(colors, heading-font, body-font, zero-bleed-dims)
      } else {
        render-photographic-back(colors, heading-font, body-font, zero-bleed-dims)
      }
    ]
  )

  // Metade Direita: Capa Frontal
  place(top + left, dx: half-w, dy: 0mm,
    block(width: half-w, height: a4-landscape-height, clip: true)[
      #if style == "classic" {
        render-classic-front(title, name, subtitle, colors, heading-font, body-font, zero-bleed-dims)
      } else if style == "modern" {
        render-modern-front(title, name, subtitle, colors, heading-font, body-font, zero-bleed-dims)
      } else {
        render-photographic-front(title, name, subtitle, colors, heading-font, body-font, zero-bleed-dims, photo-path)
      }
    ]
  )

  // Linha guia central milimétrica de corte (tracejada fina cinza)
  place(top + left, dx: half-w, dy: 0mm,
    line(start: (0mm, 0mm), end: (0mm, a4-landscape-height), stroke: (dash: "dashed", thickness: 0.35pt, paint: rgb("#94a3b8")))
  )

  // Marcas de corte superior e inferior centrais
  let mark-len = 5mm
  place(top + left, dx: half-w, dy: 0mm, line(start: (0mm, 0mm), end: (0mm, mark-len), stroke: 0.5pt + rgb("#475569")))
  place(bottom + left, dx: half-w, dy: 0mm, line(start: (0mm, 0mm), end: (0mm, -mark-len), stroke: 0.5pt + rgb("#475569")))
}


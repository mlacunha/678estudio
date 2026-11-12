#import "shared.typ": *

#let render-modern-front(title, name, subtitle, colors, heading-font, body-font, dims) = {
  place(top + left, rect(width: 100%, height: 100%, fill: rgb(colors.secondary)))

  // Bloco assimétrico de cor primária na metade superior/lateral
  let b = dims.bleed
  place(top + left,
    rect(
      width: 100%,
      height: 48% + b,
      fill: rgb(colors.primary),
    )
  )

  // Linha de acento gráfico vibrante
  place(top + left, dy: 48% + b - 1.5mm,
    rect(
      width: 100%,
      height: 3mm,
      fill: rgb(colors.accent),
    )
  )

  // Conteúdo na parte superior (sobre cor primária)
  place(top + left, dx: b + wire-o-safety-margin, dy: b + 25mm,
    block(width: dims.width - (b * 2) - wire-o-safety-margin - outer-safety-margin)[
      #if subtitle != none and subtitle != "" [
        #text(size: 8.5pt, fill: rgb(colors.accent), font: body-font, weight: "bold", tracking: 0.15em)[
          #upper(subtitle)
        ]
        #v(3mm)
      ]
      #text(size: 24pt, fill: rgb(colors.text), font: heading-font, weight: "bold", tracking: -0.02em)[
        #title
      ]
    ]
  )

  // Conteúdo na parte inferior (sobre cor secundária)
  place(top + left, dx: b + wire-o-safety-margin, dy: 58% + b,
    block(width: dims.width - (b * 2) - wire-o-safety-margin - outer-safety-margin)[
      #if name != none and name != "" [
        #text(size: 8pt, fill: rgb(colors.primary).lighten(40%), font: body-font, weight: "medium", tracking: 0.1em)[
          EDIÇÃO PERSONALIZADA
        ]
        #v(1.5mm)
        #text(size: 13pt, fill: rgb(colors.primary), font: heading-font, weight: "semibold")[
          #name
        ]
      ]
    ]
  )

  draw-crop-marks(dims)
}

#let render-modern-back(colors, heading-font, body-font, dims) = {
  place(top + left, rect(width: 100%, height: 100%, fill: rgb(colors.secondary)))

  let b = dims.bleed
  place(bottom + left,
    rect(
      width: 100%,
      height: 25mm + b,
      fill: rgb(colors.primary),
    )
  )

  place(bottom + left, dy: -(25mm + b),
    rect(
      width: 100%,
      height: 2mm,
      fill: rgb(colors.accent),
    )
  )

  cover-colophon(colors, body-font)
  draw-crop-marks(dims)
}


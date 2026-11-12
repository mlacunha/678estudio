#import "shared.typ": *

#let render-photographic-front(title, name, subtitle, colors, heading-font, body-font, dims, photo-path) = {
  // Fundo base
  place(top + left, rect(width: 100%, height: 100%, fill: rgb(colors.primary)))

  // Inserção da fotografia de fundo se fornecida
  if photo-path != none and photo-path != "" {
    place(top + left,
      block(width: 100%, height: 100%, clip: true)[
        #image(photo-path, width: 100%, height: 100%, fit: "cover")
      ]
    )

    // Gradiente/película escura semi-transparente para garantir contraste legível
    place(top + left,
      rect(
        width: 100%,
        height: 100%,
        fill: rgb(0, 0, 0, 45%),
      )
    )
  }

  let b = dims.bleed
  let text-w = dims.width - (b * 2) - wire-o-safety-margin - outer-safety-margin

  // Bloco inferior com título e nome
  place(bottom + left, dx: b + wire-o-safety-margin, dy: -(b + 20mm),
    block(width: text-w, spacing: 10pt)[
      #if subtitle != none and subtitle != "" [
        #text(size: 8pt, fill: rgb("#ffffff").lighten(10%), font: body-font, weight: "medium", tracking: 0.2em)[
          #upper(subtitle)
        ]
        #v(2mm)
      ]

      #text(size: 23pt, fill: rgb("#ffffff"), font: heading-font, weight: "bold", tracking: 0.02em)[
        #title
      ]

      #if name != none and name != "" [
        #v(3mm)
        #line(length: 20mm, stroke: 0.5pt + rgb(colors.accent))
        #v(3mm)
        #text(size: 11pt, fill: rgb("#ffffff").lighten(15%), font: body-font, tracking: 0.08em)[
          #name
        ]
      ]
    ]
  )

  draw-crop-marks(dims)
}

#let render-photographic-back(colors, heading-font, body-font, dims) = {
  place(top + left, rect(width: 100%, height: 100%, fill: rgb(colors.primary)))
  cover-colophon(colors, body-font)
  draw-crop-marks(dims)
}


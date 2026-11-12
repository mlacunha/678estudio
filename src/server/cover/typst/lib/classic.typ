#import "shared.typ": *

#let render-classic-front(title, name, subtitle, colors, heading-font, body-font, dims) = {
  place(top + left, rect(width: 100%, height: 100%, fill: rgb(colors.primary)))

  let b = dims.bleed
  let frame-inset = b + 10mm
  place(top + left, dx: frame-inset, dy: frame-inset,
    rect(
      width: dims.width - (frame-inset * 2),
      height: dims.height - (frame-inset * 2),
      stroke: 0.75pt + rgb(colors.accent),
      radius: 2pt,
    )
  )

  let inner-frame = frame-inset + 2mm
  place(top + left, dx: inner-frame, dy: inner-frame,
    rect(
      width: dims.width - (inner-frame * 2),
      height: dims.height - (inner-frame * 2),
      stroke: 0.35pt + rgb(colors.accent).lighten(40%),
      radius: 1pt,
    )
  )

  align(center + horizon)[
    #block(width: 80%, spacing: 14pt)[
      #if subtitle != none and subtitle != "" [
        #text(size: 8.5pt, fill: rgb(colors.accent), font: body-font, tracking: 0.25em)[
          #upper(subtitle)
        ]
        #v(4mm)
      ]

      #text(size: 22pt, fill: rgb(colors.text), font: heading-font, weight: "medium", tracking: 0.05em)[
        #title
      ]

      #v(6mm)
      #line(length: 25mm, stroke: 0.5pt + rgb(colors.accent))
      #v(6mm)

      #if name != none and name != "" [
        #text(size: 11pt, fill: rgb(colors.text).lighten(15%), font: body-font, weight: "regular", tracking: 0.1em)[
          #name
        ]
      ]
    ]
  ]

  draw-crop-marks(dims)
}

#let render-classic-back(colors, heading-font, body-font, dims) = {
  place(top + left, rect(width: 100%, height: 100%, fill: rgb(colors.primary)))

  let b = dims.bleed
  let frame-inset = b + 10mm
  place(top + left, dx: frame-inset, dy: frame-inset,
    rect(
      width: dims.width - (frame-inset * 2),
      height: dims.height - (frame-inset * 2),
      stroke: 0.5pt + rgb(colors.accent).lighten(50%),
      radius: 2pt,
    )
  )

  cover-colophon(colors, body-font)
  draw-crop-marks(dims)
}


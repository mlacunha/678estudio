// Shared Typst definitions for A5 Covers (Agendas, Planners, Cadernos)

#let a5-width = 148mm
#let a5-height = 210mm

#let parse-bleed(bleed-str) = {
  if bleed-str == "5mm" {
    5mm
  } else if bleed-str == "3mm" {
    3mm
  } else {
    0mm
  }
}

#let get-page-dimensions(bleed-str) = {
  let b = parse-bleed(bleed-str)
  (
    width: a5-width + (b * 2),
    height: a5-height + (b * 2),
    bleed: b,
  )
}

// Crop marks for print finishing
#let draw-crop-marks(dims) = {
  if dims.bleed > 0mm {
    let mark-len = 4mm
    let b = dims.bleed
    let w = dims.width
    let h = dims.height
    let stroke-style = 0.25pt + rgb("#64748b")

    place(top + left, dx: b, dy: 0mm, line(start: (0mm, 0mm), end: (0mm, -mark-len), stroke: stroke-style))
    place(top + left, dx: 0mm, dy: b, line(start: (0mm, 0mm), end: (-mark-len, 0mm), stroke: stroke-style))

    place(top + left, dx: w - b, dy: 0mm, line(start: (0mm, 0mm), end: (0mm, -mark-len), stroke: stroke-style))
    place(top + left, dx: w, dy: b, line(start: (0mm, 0mm), end: (mark-len, 0mm), stroke: stroke-style))

    place(top + left, dx: b, dy: h, line(start: (0mm, 0mm), end: (0mm, mark-len), stroke: stroke-style))
    place(top + left, dx: 0mm, dy: h - b, line(start: (0mm, 0mm), end: (-mark-len, 0mm), stroke: stroke-style))

    place(top + left, dx: w - b, dy: h, line(start: (0mm, 0mm), end: (0mm, mark-len), stroke: stroke-style))
    place(top + left, dx: w, dy: h - b, line(start: (0mm, 0mm), end: (mark-len, 0mm), stroke: stroke-style))
  }
}

// Wire-O punching safety zone (left margin for front cover, right margin for back cover)
#let wire-o-safety-margin = 15mm
#let outer-safety-margin = 8mm

#let get-cover-margins(is-front, dims) = {
  let b = dims.bleed
  if is-front {
    (
      top: b + outer-safety-margin,
      bottom: b + outer-safety-margin,
      left: b + wire-o-safety-margin, // Borda da furação
      right: b + outer-safety-margin,
    )
  } else {
    (
      top: b + outer-safety-margin,
      bottom: b + outer-safety-margin,
      left: b + outer-safety-margin,
      right: b + wire-o-safety-margin, // Borda da furação na contracapa
    )
  }
}

// Colophon on back cover
#let cover-colophon(colors, text-font) = {
  align(center + bottom)[
    #block(spacing: 8pt)[
      #image("../brand-678.png", width: 22mm)
      #v(2mm)
      #text(size: 7pt, fill: rgb(colors.text).lighten(30%), font: text-font, tracking: 0.15em)[
        6 7 8  E S T U D I O
      ]
      #v(0.5mm)
      #text(size: 6pt, fill: rgb(colors.text).lighten(45%), font: text-font)[
        Papelaria Artesanal & Encadernação Fina
      ]
    ]
  ]
}


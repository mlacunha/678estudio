#import "lib/shared.typ": *
#import "lib/classic.typ": *
#import "lib/modern.typ": *
#import "lib/photographic.typ": *
#import "lib/combined_a4.typ": *

#let target = sys.inputs.at("target", default: "front-a5")
#let bleed-str = sys.inputs.at("bleed", default: "3mm")
#let style = sys.inputs.at("style", default: "classic")
#let typography = sys.inputs.at("typography", default: "editorial")
#let title = sys.inputs.at("title", default: "678 Estudio")
#let name = sys.inputs.at("name", default: "")
#let subtitle = sys.inputs.at("subtitle", default: "")
#let photo-path = sys.inputs.at("photo", default: "")

#let primary-color = sys.inputs.at("color_primary", default: "#1e293b")
#let secondary-color = sys.inputs.at("color_secondary", default: "#f8fafc")
#let text-color = sys.inputs.at("color_text", default: "#ffffff")
#let accent-color = sys.inputs.at("color_accent", default: "#c5a059")

#let colors = (
  primary: primary-color,
  secondary: secondary-color,
  text: text-color,
  accent: accent-color,
)

#let heading-font = if typography == "editorial" {
  "DM Serif Display"
} else if typography == "geometric" {
  "Manrope"
} else {
  "Inter"
}

#let body-font = "Inter"

// Page setup depends on target
#if target == "combined-a4" {
  set page(
    width: a4-landscape-width,
    height: a4-landscape-height,
    margin: 0mm,
  )
  render-combined-a4(style, title, name, subtitle, colors, heading-font, body-font, photo-path)
} else {
  let dims = get-page-dimensions(bleed-str)
  set page(
    width: dims.width,
    height: dims.height,
    margin: 0mm,
  )

  if target == "back-a5" {
    if style == "classic" {
      render-classic-back(colors, heading-font, body-font, dims)
    } else if style == "modern" {
      render-modern-back(colors, heading-font, body-font, dims)
    } else {
      render-photographic-back(colors, heading-font, body-font, dims)
    }
  } else {
    // Default is front-a5
    if style == "classic" {
      render-classic-front(title, name, subtitle, colors, heading-font, body-font, dims)
    } else if style == "modern" {
      render-modern-front(title, name, subtitle, colors, heading-font, body-font, dims)
    } else {
      render-photographic-front(title, name, subtitle, colors, heading-font, body-font, dims, photo-path)
    }
  }
}

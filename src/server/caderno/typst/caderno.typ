#import "lib/receitas.typ": render-caderno-receitas
#import "lib/diario.typ": render-diario-pessoal
#import "lib/memorias.typ": render-livro-memorias

#let model = sys.inputs.at("model", default: "caderno-receitas")
#let style-id = sys.inputs.at("style", default: "classic")
#let typo-id = sys.inputs.at("typography", default: "modern")
#let custom-title = sys.inputs.at("title", default: "")
#let personalization-name = sys.inputs.at("personalization_name", default: "")
#let dedication = sys.inputs.at("dedication", default: "")
#let single-section = sys.inputs.at("section", default: "all")

#let has-logo = "logo" in sys.inputs
#let has-watermark = "watermark" in sys.inputs and has-logo

#let primary = rgb(sys.inputs.at("primary", default: "#1f2937"))
#let secondary = rgb(sys.inputs.at("secondary", default: "#4b5563"))
#let accent = rgb(sys.inputs.at("accent", default: "#b0892f"))

#let (font-body, font-heading) = if typo-id == "geometric" {
  ("Manrope", "Manrope")
} else if typo-id == "editorial" {
  (("DM Sans 9pt", "DM Sans"), "DM Serif Display")
} else {
  ("Inter", "Inter")
}

#let colors = (
  primary: primary,
  secondary: secondary,
  accent: accent,
  lines: color.mix((white, 72%), (secondary, 28%)),
  writing-lines: color.mix((white, 80%), (secondary, 20%)),
  bodyFont: font-body,
  headingFont: font-heading,
)

#let studio = (
  instagram: sys.inputs.at("studio_instagram", default: "@678estudio"),
  site: sys.inputs.at("studio_site", default: "678estudio.com.br"),
  whatsapp: sys.inputs.at("studio_whatsapp", default: ""),
  email: sys.inputs.at("studio_email", default: ""),
)

#let model-label = if model == "diario-pessoal" {
  "Diário Pessoal"
} else if model == "livro-memorias" {
  "Livro de Memórias"
} else {
  "Caderno de Receitas"
}

#let watermark-bg = if has-watermark [
  #place(center + horizon, rotate(-22deg, image("logo.png", width: 60mm, height: 60mm, fit: "contain")))
  #place(top + left, rect(width: 100%, height: 100%, fill: white.transparentize(12%), stroke: none))
] else { none }

#set document(title: if custom-title != "" { custom-title } else { model-label }, author: "678 Estudio")
#set text(lang: "pt", region: "BR", font: font-body, size: 8.8pt, fill: colors.primary)
#set page(
  paper: "a5",
  margin: (top: 13mm, bottom: 13mm, inside: 20mm, outside: 12mm),
  background: if single-section == "abertura" or single-section == "all" { none } else { watermark-bg },
  footer: context grid(
    columns: (1fr, auto),
    align: horizon,
    if has-logo and counter(page).get().first() > 1 {
      grid(
        columns: (auto, auto),
        column-gutter: 5pt,
        align: horizon,
        image("logo.png", width: 17mm, height: 4.2mm, fit: "contain"),
        text(size: 6.4pt, fill: colors.secondary)[· #model-label · 678 Estudio],
      )
    } else {
      text(size: 6.8pt, fill: colors.secondary)[#model-label · 678 Estudio]
    },
    text(size: 6.8pt, fill: colors.primary)[#counter(page).display()],
  ),
)

#if model == "diario-pessoal" [
  #render-diario-pessoal(
    colors,
    studio,
    customTitle: custom-title,
    personalizationName: personalization-name,
    hasLogo: has-logo,
    watermarkBg: watermark-bg,
    singleSection: single-section,
  )
] else if model == "livro-memorias" [
  #render-livro-memorias(
    colors,
    studio,
    customTitle: custom-title,
    personalizationName: personalization-name,
    dedication: dedication,
    hasLogo: has-logo,
    watermarkBg: watermark-bg,
    singleSection: single-section,
  )
] else [
  #render-caderno-receitas(
    colors,
    studio,
    customTitle: custom-title,
    personalizationName: personalization-name,
    hasLogo: has-logo,
    watermarkBg: watermark-bg,
    singleSection: single-section,
  )
]


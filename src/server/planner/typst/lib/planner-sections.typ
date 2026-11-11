#let rule-line(colors, height: 5.5mm) = {
  block(width: 100%, height: height, above: 0pt, below: 0pt)[
    #place(bottom, line(length: 100%, stroke: colors.lines + 0.35pt))
  ]
}

#let dotted-line(colors, height: 5.5mm) = {
  block(width: 100%, height: height, above: 0pt, below: 0pt)[
    #place(bottom, line(length: 100%, stroke: (paint: colors.lines, thickness: 0.45pt, dash: "dotted")))
  ]
}

#let checkbox-line(colors, height: 5.4mm) = {
  block(width: 100%, above: 0pt, below: 0pt)[
    #grid(
      columns: (3.8mm, 1fr),
      gutter: 2mm,
      align: horizon,
      rect(width: 3.2mm, height: 3.2mm, stroke: colors.secondary + 0.5pt, radius: 0.5mm),
      rule-line(colors, height: height),
    )
  ]
}

#let section-header(title, colors, subtitle: none) = [
  #let h-font = if colors.at("headingFont", default: none) != none { colors.headingFont } else { auto }
  #block(width: 100%, below: 3mm)[
    #text(size: 15pt, weight: "bold", fill: colors.primary, font: h-font, title)
    #if subtitle != none [
      #h(4pt) · #text(size: 9.5pt, fill: colors.secondary, subtitle)
    ]
    #v(1.2mm)
    #line(length: 100%, stroke: colors.accent + 0.9pt)
  ]
]

// 1. Abertura e Identificação Pessoal
#let section-abertura(colors, personalizationName: none, year: none, mode: "dated", hasLogo: false) = [
  #let h-font = if colors.at("headingFont", default: none) != none { colors.headingFont } else { auto }
  #if hasLogo [
    #v(3mm)
    #align(center)[
      #block(width: 58mm, height: 24mm, inset: 1.5mm)[
        #align(center + horizon)[
          #image("../logo.png", width: 100%, height: 100%, fit: "contain")
        ]
      ]
    ]
    #v(2mm)
  ] else [
    #v(12mm)
  ]
  #align(center)[
    #text(size: 24pt, weight: "light", fill: colors.primary, font: h-font)[PLANNER] \
    #text(size: 13pt, weight: "medium", fill: colors.accent, font: h-font)[ESSENCIAL]
    #v(2mm)
    #if mode == "dated" and year != none [
      #text(size: 10.5pt, fill: colors.secondary)[Edição Oficial · #str(year)]
    ] else [
      #text(size: 10.5pt, fill: colors.secondary)[Edição Permanente · Atemporal]
    ]
  ]
  #v(6mm)
  #block(stroke: colors.lines + 0.6pt, inset: 4.5mm, radius: 2mm, width: 100%)[
    #text(size: 9.5pt, weight: "bold", fill: colors.primary)[Identificação & Dados Pessoais]
    #v(2mm)
    #text(size: 8pt, fill: colors.secondary)[Nome / Identificação:]
    #if personalizationName != none and personalizationName != "" [
      #text(size: 10.5pt, weight: "bold", fill: colors.primary)[ #personalizationName]
    ]
    #rule-line(colors, height: 5.2mm)
    #v(1.5mm)
    #grid(columns: (1fr, 1fr), gutter: 4mm,
      [
        #text(size: 8pt, fill: colors.secondary)[Telefone / WhatsApp:]
        #rule-line(colors, height: 5.2mm)
      ],
      [
        #text(size: 8pt, fill: colors.secondary)[E-mail:]
        #rule-line(colors, height: 5.2mm)
      ]
    )
    #v(1.5mm)
    #grid(columns: (1fr, 1fr), gutter: 4mm,
      [
        #text(size: 8pt, fill: colors.secondary)[Cidade / UF:]
        #rule-line(colors, height: 5.2mm)
      ],
      [
        #text(size: 8pt, fill: colors.secondary)[Contato de Emergência:]
        #rule-line(colors, height: 5.2mm)
      ]
    )
    #v(1.5mm)
    #text(size: 8pt, fill: colors.secondary)[Propósito & Direcionamento Principal do Período:]
    #rule-line(colors, height: 5.5mm)
    #rule-line(colors, height: 5.5mm)
  ]
  #v(4mm)
  #block(stroke: colors.lines + 0.5pt, inset: 4mm, radius: 2mm, width: 100%)[
    #text(size: 9pt, weight: "bold", fill: colors.accent)[Referências & Informações Importantes]
    #for _ in range(4) { rule-line(colors, height: 5.5mm) }
  ]
]

// 2. Planejamento Anual
#let section-anual(colors, year: none, mode: "dated") = [
  #section-header("Planejamento Anual", colors, subtitle: if mode == "dated" and year != none { str(year) } else { "Metas & Visão" })
  #text(size: 8pt, fill: colors.secondary)[Definição de objetivos macro, prioridades e entregas trimestrais]
  #v(2mm)
  #grid(columns: (1fr, 1fr), gutter: 3mm,
    block(stroke: colors.lines + 0.4pt, inset: 2.8mm, radius: 1.5mm)[
      #text(size: 8pt, weight: "bold", fill: colors.primary)[Objetivos Profissionais & Carreira]
      #for _ in range(6) { rule-line(colors, height: 4.8mm) }
    ],
    block(stroke: colors.lines + 0.4pt, inset: 2.8mm, radius: 1.5mm)[
      #text(size: 8pt, weight: "bold", fill: colors.primary)[Objetivos Pessoais & Saúde]
      #for _ in range(6) { rule-line(colors, height: 4.8mm) }
    ],
    block(stroke: colors.lines + 0.4pt, inset: 2.8mm, radius: 1.5mm)[
      #text(size: 8pt, weight: "bold", fill: colors.primary)[Metas Financeiras & Patrimônio]
      #for _ in range(6) { rule-line(colors, height: 4.8mm) }
    ],
    block(stroke: colors.lines + 0.4pt, inset: 2.8mm, radius: 1.5mm)[
      #text(size: 8pt, weight: "bold", fill: colors.primary)[Projetos, Estudos & Viagens]
      #for _ in range(6) { rule-line(colors, height: 4.8mm) }
    ]
  )
  #v(2.5mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[Marcos & Entregas Prioritárias por Trimestre]
  #v(1mm)
  #grid(columns: (1fr, 1fr), gutter: 3mm,
    block(stroke: colors.lines + 0.35pt, inset: 2.2mm, radius: 1mm)[
      #text(size: 7.5pt, weight: "bold", fill: colors.secondary)[1º Trimestre (Jan – Mar)]
      #for _ in range(3) { dotted-line(colors, height: 4.8mm) }
    ],
    block(stroke: colors.lines + 0.35pt, inset: 2.2mm, radius: 1mm)[
      #text(size: 7.5pt, weight: "bold", fill: colors.secondary)[2º Trimestre (Abr – Jun)]
      #for _ in range(3) { dotted-line(colors, height: 4.8mm) }
    ],
    block(stroke: colors.lines + 0.35pt, inset: 2.2mm, radius: 1mm)[
      #text(size: 7.5pt, weight: "bold", fill: colors.secondary)[3º Trimestre (Jul – Set)]
      #for _ in range(3) { dotted-line(colors, height: 4.8mm) }
    ],
    block(stroke: colors.lines + 0.35pt, inset: 2.2mm, radius: 1mm)[
      #text(size: 7.5pt, weight: "bold", fill: colors.secondary)[4º Trimestre (Out – Dez)]
      #for _ in range(3) { dotted-line(colors, height: 4.8mm) }
    ],
  )
]

// 2B. Metas Anuais & Visão Estratégica (Página oposta ao Planejamento Anual)
#let section-anual-metas(colors, year: 2027, mode: "dated") = [
  #let title-ano = if mode == "dated" { "Metas Estratégicas " + str(year) } else { "Metas & Objetivos Anuais" }
  #section-header(title-ano, colors, subtitle: "Direcionamento e Conquistas Prioritárias")
  #v(1mm)
  #block(stroke: colors.lines + 0.4pt, inset: 2.8mm, radius: 1.5mm, below: 2.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.accent)[1. Desenvolvimento Pessoal, Saúde & Qualidade de Vida]
    #for _ in range(5) { checkbox-line(colors, height: 4.9mm) }
  ]
  #block(stroke: colors.lines + 0.4pt, inset: 2.8mm, radius: 1.5mm, below: 2.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.secondary)[2. Carreira, Negócios & Posicionamento Profissional]
    #for _ in range(5) { checkbox-line(colors, height: 4.9mm) }
  ]
  #block(stroke: colors.lines + 0.4pt, inset: 2.8mm, radius: 1.5mm, below: 2.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.primary)[3. Metas Financeiras, Poupança & Investimentos]
    #for _ in range(5) { checkbox-line(colors, height: 4.9mm) }
  ]
  #block(stroke: colors.accent + 0.5pt, inset: 2.8mm, radius: 1.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.primary)[4. Grandes Projetos, Estudos & Conquistas do Ano]
    #for _ in range(5) { checkbox-line(colors, height: 4.9mm) }
  ]
]

// 3. Planejamento Mensal
#let section-mensal(monthName, colors, year: none, mode: "dated") = [
  #section-header("Visão Mensal", colors, subtitle: monthName + if mode == "dated" and year != none { " · " + str(year) } else { "" })
  #grid(columns: (1.2fr, 1fr), gutter: 4mm,
    block[
      #text(size: 8.5pt, weight: "bold", fill: colors.primary)[Prioridades Máximas do Mês]
      #for _ in range(6) { checkbox-line(colors, height: 5.3mm) }
      #v(2.5mm)
      #text(size: 8.5pt, weight: "bold", fill: colors.primary)[Compromissos & Datas-Chave]
      #for _ in range(8) { rule-line(colors, height: 5.3mm) }
    ],
    block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm)[
      #text(size: 8pt, weight: "bold", fill: colors.secondary)[Referência Mensal]
      #v(1.5mm)
      #table(columns: (1fr,) * 7, inset: 1.8pt, align: center, stroke: none,
        text(size: 6pt, weight: "bold", fill: colors.accent)[S],
        text(size: 6pt, weight: "bold", fill: colors.accent)[T],
        text(size: 6pt, weight: "bold", fill: colors.accent)[Q],
        text(size: 6pt, weight: "bold", fill: colors.accent)[Q],
        text(size: 6pt, weight: "bold", fill: colors.accent)[S],
        text(size: 6pt, weight: "bold", fill: colors.accent)[S],
        text(size: 6pt, weight: "bold", fill: colors.accent)[D],
        ..range(31).map(idx => text(size: 6pt, fill: colors.primary)[#str(idx + 1)])
      )
      #v(2.5mm)
      #text(size: 8pt, weight: "bold", fill: colors.primary)[Foco & Intenção:]
      #for _ in range(5) { dotted-line(colors, height: 5.1mm) }
      #v(2mm)
      #text(size: 8pt, weight: "bold", fill: colors.secondary)[Projetos em Curso:]
      #for _ in range(4) { dotted-line(colors, height: 5.1mm) }
    ]
  )
  #v(3mm)
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, width: 100%)[
    #text(size: 8.5pt, weight: "bold", fill: colors.accent)[Plano de Ação & Entregas Importantes do Mês]
    #v(1mm)
    #grid(columns: (1fr, 1fr), column-gutter: 4mm,
      [#for _ in range(5) { checkbox-line(colors, height: 5.2mm) }],
      [#for _ in range(5) { checkbox-line(colors, height: 5.2mm) }],
    )
  ]
]

// 4. Planejamento Semanal (Página Esquerda: Seg, Ter, Qua + Prioridades + Notas)
#let section-semanal-left(colors, weekInfo: none, monthName: "Mês") = [
  #let week-title = if weekInfo != none and weekInfo.at("weekNumber", default: none) != none {
    "Semana " + str(weekInfo.weekNumber)
  } else {
    "Semana"
  }
  #section-header(week-title, colors, subtitle: monthName + " · Foco & Início")
  #block(stroke: colors.lines + 0.4pt, inset: 2.5mm, radius: 1.5mm, width: 100%, below: 2.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.accent)[Prioridades da Semana]
    #grid(columns: (1fr, 1fr), column-gutter: 3mm,
      [#for _ in range(2) { checkbox-line(colors, height: 5mm) }],
      [#for _ in range(2) { checkbox-line(colors, height: 5mm) }],
    )
  ]
  #let left-days = if weekInfo != none and weekInfo.at("leftDays", default: none) != none {
    weekInfo.leftDays
  } else {
    (
      (weekday: "Segunda-feira", day: none, monthShort: ""),
      (weekday: "Terça-feira", day: none, monthShort: ""),
      (weekday: "Quarta-feira", day: none, monthShort: ""),
    )
  }
  #for dia in left-days [
    #let label = if dia.at("day", default: none) != none {
      dia.weekday + " · " + str(dia.day) + " " + dia.monthShort
    } else {
      dia.weekday + " [ ___ / ___ ]"
    }
    #block(stroke: colors.lines + 0.35pt, inset: 2.5mm, radius: 1mm, width: 100%, below: 2.2mm)[
      #text(size: 8.5pt, weight: "bold", fill: colors.primary, label)
      #for _ in range(5) { dotted-line(colors, height: 5mm) }
    ]
  ]
  #block(stroke: colors.lines + 0.35pt, inset: 2.5mm, radius: 1mm, width: 100%)[
    #text(size: 8pt, weight: "bold", fill: colors.secondary)[Lembretes, Contatos & Assuntos da Semana]
    #for _ in range(3) { rule-line(colors, height: 5mm) }
  ]
]

// 4. Planejamento Semanal (Página Direita: Qui, Sex, Sab, Dom + Tarefas & Notas)
#let section-semanal-right(colors, weekInfo: none, monthName: "Mês") = [
  #let week-title = if weekInfo != none and weekInfo.at("weekNumber", default: none) != none {
    "Semana " + str(weekInfo.weekNumber)
  } else {
    "Semana"
  }
  #section-header(week-title, colors, subtitle: monthName + " · Conclusão & Ações")
  #let right-days = if weekInfo != none and weekInfo.at("rightDays", default: none) != none {
    weekInfo.rightDays
  } else {
    (
      (weekday: "Quinta-feira", day: none, monthShort: ""),
      (weekday: "Sexta-feira", day: none, monthShort: ""),
      (weekday: "Sábado", day: none, monthShort: ""),
      (weekday: "Domingo", day: none, monthShort: ""),
    )
  }
  #let d-qui = if right-days.len() > 0 { right-days.at(0) } else { (weekday: "Quinta-feira", day: none, monthShort: "") }
  #let d-sex = if right-days.len() > 1 { right-days.at(1) } else { (weekday: "Sexta-feira", day: none, monthShort: "") }
  #let d-sab = if right-days.len() > 2 { right-days.at(2) } else { (weekday: "Sábado", day: none, monthShort: "") }
  #let d-dom = if right-days.len() > 3 { right-days.at(3) } else { (weekday: "Domingo", day: none, monthShort: "") }

  #for dia in (d-qui, d-sex) [
    #let label = if dia.at("day", default: none) != none {
      dia.weekday + " · " + str(dia.day) + " " + dia.monthShort
    } else {
      dia.weekday + " [ ___ / ___ ]"
    }
    #block(stroke: colors.lines + 0.35pt, inset: 2.5mm, radius: 1mm, width: 100%, below: 2.2mm)[
      #text(size: 8.5pt, weight: "bold", fill: colors.primary, label)
      #for _ in range(4) { dotted-line(colors, height: 5mm) }
    ]
  ]

  #let label-sab = if d-sab.at("day", default: none) != none {
    "Sábado · " + str(d-sab.day) + " " + d-sab.monthShort
  } else {
    "Sábado [ ___ / ___ ]"
  }
  #let label-dom = if d-dom.at("day", default: none) != none {
    "Domingo · " + str(d-dom.day) + " " + d-dom.monthShort
  } else {
    "Domingo [ ___ / ___ ]"
  }

  #grid(columns: (1fr, 1fr), gutter: 2.5mm,
    block(stroke: colors.lines + 0.35pt, inset: 2.2mm, radius: 1mm)[
      #text(size: 8pt, weight: "bold", fill: colors.primary, label-sab)
      #for _ in range(4) { dotted-line(colors, height: 5mm) }
    ],
    block(stroke: colors.lines + 0.35pt, inset: 2.2mm, radius: 1mm)[
      #text(size: 8pt, weight: "bold", fill: colors.primary, label-dom)
      #for _ in range(4) { dotted-line(colors, height: 5mm) }
    ]
  )
  #v(2.2mm)
  #block(stroke: colors.lines + 0.4pt, inset: 2.5mm, radius: 1.5mm, width: 100%)[
    #text(size: 8pt, weight: "bold", fill: colors.accent)[Checklist de Tarefas & Pendências da Semana]
    #v(0.5mm)
    #grid(columns: (1fr, 1fr), column-gutter: 3.5mm,
      [#for _ in range(5) { checkbox-line(colors, height: 4.8mm) }],
      [#for _ in range(5) { checkbox-line(colors, height: 4.8mm) }],
    )
    #v(1.5mm)
    #text(size: 7.5pt, weight: "bold", fill: colors.secondary)[Notas & Balanço da Semana:]
    #for _ in range(2) { rule-line(colors, height: 4.8mm) }
  ]
]

// 5. Controle de Hábitos (Habit Tracker)
#let section-habitos(monthName, colors, mode: "dated") = [
  #section-header("Controle de Hábitos", colors, subtitle: monthName)
  #text(size: 8pt, fill: colors.secondary)[Acompanhamento diário de constância, disciplina e bem-estar (31 dias)]
  #v(2mm)
  #let habit-row(name) = (
    align(left + horizon, text(size: 7pt, weight: "medium", fill: colors.primary, name)),
    ..range(31).map(_ => circle(radius: 1.15mm, stroke: colors.lines + 0.4pt))
  )
  #table(
    columns: (28mm, ..(1fr,) * 31),
    inset: (x: 1.5pt, y: 3.2pt),
    align: center + horizon,
    stroke: colors.lines + 0.25pt,
    table.header(
      align(left + horizon, text(size: 7pt, weight: "bold", fill: colors.accent)[Hábito / Meta]),
      ..range(1, 32).map(d => text(size: 5pt, fill: colors.secondary)[#d])
    ),
    ..habit-row("Leitura / Estudo"),
    ..habit-row("Exercício Físico"),
    ..habit-row("Ingestão de Água"),
    ..habit-row("Planejar o Dia"),
    ..habit-row("Sono Regular (8h)"),
    ..habit-row("Alimentação Limpa"),
    ..habit-row("Revisar Finanças"),
    ..habit-row("Zero Telas à Noite"),
    ..habit-row("Hábito Livre 1:"),
    ..habit-row("Hábito Livre 2:"),
    ..habit-row("Hábito Livre 3:"),
    ..habit-row("Hábito Livre 4:"),
  )
  #v(3mm)
  #grid(columns: (1fr, 1fr), gutter: 3.5mm,
    block(stroke: colors.lines + 0.35pt, inset: 2.5mm, radius: 1mm)[
      #text(size: 8pt, weight: "bold", fill: colors.secondary)[Rotina Matinal & Energia]
      #for _ in range(4) { dotted-line(colors, height: 5mm) }
    ],
    block(stroke: colors.lines + 0.35pt, inset: 2.5mm, radius: 1mm)[
      #text(size: 8pt, weight: "bold", fill: colors.secondary)[Rotina Noturna & Descanso]
      #for _ in range(4) { dotted-line(colors, height: 5mm) }
    ]
  )
  #v(3mm)
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, width: 100%)[
    #text(size: 8pt, weight: "bold", fill: colors.primary)[Avaliação de Consistência & Ajustes do Mês]
    #for _ in range(5) { rule-line(colors, height: 5.2mm) }
  ]
]

#let pay-box(colors) = rect(width: 2.6mm, height: 2.6mm, stroke: colors.secondary + 0.5pt, radius: 0.4mm)
#let empty-cell = [#v(3.2mm)]

// 6. Controle Financeiro Completo (Visão consolidada para prévia da seção)
#let section-financeiro(monthName, colors, mode: "dated") = [
  #set text(size: 7.5pt)
  #section-header("Controle Financeiro", colors, subtitle: monthName)
  #text(size: 7.5pt, fill: colors.secondary)[Gestão mensal de receitas, despesas fixas, variáveis, metas e balanço]
  #v(1.5mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[1. Receitas & Entradas do Mês]
  #table(
    columns: (1fr, 15mm, 20mm, 20mm),
    inset: (x: 3pt, y: 2.7pt),
    align: (left, center, right, right),
    stroke: colors.lines + 0.3pt,
    table.header([*Fonte / Descrição*], [*Data*], [*Previsto*], [*Realizado*]),
    [Salário / Pró-labore], [], [], [],
    [Projetos Extras / Comissões], [], [], [],
    [Rendimentos & Dividendos], [], [], [],
    [#empty-cell], [], [], [],
    [#empty-cell], [], [], [],
  )
  #v(2mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[2. Despesas Fixas, Variáveis & Contas a Pagar]
  #table(
    columns: (1fr, 15mm, 19mm, 19mm, 11mm),
    inset: (x: 3pt, y: 2.7pt),
    align: (left, center, right, right, center),
    stroke: colors.lines + 0.3pt,
    table.header([*Descrição da Despesa*], [*Venc.*], [*Previsto*], [*Realizado*], [*Pago*]),
    [Moradia / Aluguel / Condomínio], [], [], [], [#pay-box(colors)],
    [Energia / Água / Gás], [], [], [], [#pay-box(colors)],
    [Internet / Telefonia / TV], [], [], [], [#pay-box(colors)],
    [Alimentação & Supermercado], [], [], [], [#pay-box(colors)],
    [Transporte & Combustível], [], [], [], [#pay-box(colors)],
    [Saúde / Farmácia / Seguro], [], [], [], [#pay-box(colors)],
    [Cartão de Crédito / Parcelas], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
  )
  #v(2mm)
  #text(size: 8pt, weight: "bold", fill: colors.secondary)[3. Metas Financeiras & Reserva]
  #table(
    columns: (1fr, 22mm, 22mm),
    inset: (x: 3pt, y: 2.7pt),
    align: (left, right, right),
    stroke: colors.lines + 0.3pt,
    table.header([*Meta / Investimento*], [*Meta (R\$)*], [*Aporte (R\$)*]),
    [Reserva de Emergência / Poupança], [], [],
    [Investimentos / Objetivo Especial], [], [],
    [#empty-cell], [], [],
  )
  #v(2mm)
  #block(stroke: colors.accent + 0.6pt, inset: 2.5mm, radius: 1.5mm, fill: colors.lines.transparentize(85%))[
    #grid(columns: (1fr, 1fr, 1fr, 1fr), gutter: 2mm, align: center,
      [#text(size: 7pt, fill: colors.secondary)[Total Receitas] \ #rule-line(colors, height: 4.2mm)],
      [#text(size: 7pt, fill: colors.secondary)[Total Fixas] \ #rule-line(colors, height: 4.2mm)],
      [#text(size: 7pt, fill: colors.secondary)[Total Variáveis] \ #rule-line(colors, height: 4.2mm)],
      [#text(size: 7pt, weight: "bold", fill: colors.primary)[Saldo Líquido] \ #rule-line(colors, height: 4.2mm)]
    )
  ]
]

// 6A. Controle Financeiro - Página Esquerda (Receitas, Despesas Fixas & Vencimentos)
#let section-financeiro-left(monthName, colors, mode: "dated") = [
  #set text(size: 7.5pt)
  #section-header("Controle Financeiro", colors, subtitle: monthName + " · Entradas & Despesas Fixas")
  #text(size: 8pt, weight: "bold", fill: colors.accent)[1. Receitas & Fontes de Renda]
  #table(
    columns: (1fr, 15mm, 21mm, 21mm),
    inset: (x: 3pt, y: 2.9pt),
    align: (left, center, right, right),
    stroke: colors.lines + 0.3pt,
    table.header([*Fonte de Receita / Descrição*], [*Data*], [*Previsto*], [*Realizado*]),
    [Salário / Remuneração Principal], [], [], [],
    [Projetos Extras & Comissões], [], [], [],
    [Rendimentos & Dividendos], [], [], [],
    [Reembolsos / Outras Entradas], [], [], [],
    [#empty-cell], [], [], [],
    [#empty-cell], [], [], [],
    [#empty-cell], [], [], [],
    [*Total de Receitas do Mês*], [], [], [],
  )
  #v(2.5mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[2. Despesas Fixas, Contas & Vencimentos]
  #table(
    columns: (1fr, 15mm, 19mm, 19mm, 11mm),
    inset: (x: 3pt, y: 2.9pt),
    align: (left, center, right, right, center),
    stroke: colors.lines + 0.3pt,
    table.header([*Despesa Fixa / Conta*], [*Venc.*], [*Previsto*], [*Pago (R\$)*], [*OK*]),
    [Moradia / Aluguel / Financiamento], [], [], [], [#pay-box(colors)],
    [Condomínio / IPTU / Taxas], [], [], [], [#pay-box(colors)],
    [Energia Elétrica & Gás], [], [], [], [#pay-box(colors)],
    [Água & Saneamento], [], [], [], [#pay-box(colors)],
    [Internet / TV / Telefonia], [], [], [], [#pay-box(colors)],
    [Saúde / Plano / Medicamentos], [], [], [], [#pay-box(colors)],
    [Educação / Cursos / Idiomas], [], [], [], [#pay-box(colors)],
    [Seguros & Taxas Bancárias], [], [], [], [#pay-box(colors)],
    [Assinaturas & Serviços Fixos], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [*Total de Despesas Fixas*], [], [], [], [],
  )
]

// 6B. Controle Financeiro - Página Direita (Despesas Variáveis, Metas & Resumo Financeiro)
#let section-financeiro-right(monthName, colors, mode: "dated") = [
  #set text(size: 7.5pt)
  #section-header("Controle Financeiro", colors, subtitle: monthName + " · Variáveis, Metas & Balanço")
  #text(size: 8pt, weight: "bold", fill: colors.accent)[3. Despesas Variáveis & Cartões de Crédito]
  #table(
    columns: (1fr, 15mm, 19mm, 19mm, 11mm),
    inset: (x: 3pt, y: 2.8pt),
    align: (left, center, right, right, center),
    stroke: colors.lines + 0.3pt,
    table.header([*Despesa Variável / Lançamento*], [*Data*], [*Previsto*], [*Realizado*], [*OK*]),
    [Alimentação & Supermercado], [], [], [], [#pay-box(colors)],
    [Transporte & Combustível], [], [], [], [#pay-box(colors)],
    [Cartão de Crédito · Fatura 1], [], [], [], [#pay-box(colors)],
    [Cartão de Crédito · Fatura 2], [], [], [], [#pay-box(colors)],
    [Lazer, Restaurantes & Cultura], [], [], [], [#pay-box(colors)],
    [Vestuário & Cuidados Pessoais], [], [], [], [#pay-box(colors)],
    [Casa, Manutenção & Imprevistos], [], [], [], [#pay-box(colors)],
    [Presentes, Doações & Família], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [], [#pay-box(colors)],
    [*Total de Despesas Variáveis*], [], [], [], [],
  )
  #v(2mm)
  #text(size: 8pt, weight: "bold", fill: colors.secondary)[4. Metas Financeiras, Poupança & Investimentos]
  #table(
    columns: (1fr, 20mm, 20mm, 14mm),
    inset: (x: 3pt, y: 2.8pt),
    align: (left, right, right, center),
    stroke: colors.lines + 0.3pt,
    table.header([*Meta / Reserva / Investimento*], [*Meta*], [*Aporte*], [*OK*]),
    [Reserva de Emergência], [], [], [#pay-box(colors)],
    [Carteira de Investimentos], [], [], [#pay-box(colors)],
    [Projetos de Curto Prazo], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [#pay-box(colors)],
    [#empty-cell], [], [], [#pay-box(colors)],
  )
  #v(2mm)
  #block(stroke: colors.accent + 0.6pt, inset: 2.5mm, radius: 1.5mm, fill: colors.lines.transparentize(85%))[
    #text(size: 7.5pt, weight: "bold", fill: colors.primary)[5. Resumo Financeiro do Mês]
    #v(1mm)
    #grid(columns: (1fr, 1fr, 1fr, 1fr), gutter: 2.5mm, align: center,
      [#text(size: 7pt, fill: colors.secondary)[(+) Receitas] \ #rule-line(colors, height: 4.2mm)],
      [#text(size: 7pt, fill: colors.secondary)[(-) Desp. Fixas] \ #rule-line(colors, height: 4.2mm)],
      [#text(size: 7pt, fill: colors.secondary)[(-) Variáveis] \ #rule-line(colors, height: 4.2mm)],
      [#text(size: 7pt, weight: "bold", fill: colors.primary)[(=) Saldo Final] \ #rule-line(colors, height: 4.2mm)]
    )
    #v(1mm)
    #text(size: 7pt, fill: colors.secondary)[Notas & Ajustes Orçamentários:]
    #rule-line(colors, height: 4.2mm)
  ]
]

// 7. Revisão Mensal
#let section-revisao(monthName, colors, mode: "dated") = [
  #section-header("Revisão Mensal", colors, subtitle: monthName + " · Balanço")
  #text(size: 8pt, fill: colors.secondary)[Análise de conquistas, aprendizados e calibragem para o próximo ciclo]
  #v(2mm)
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, below: 2.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.primary)[1. Principais Conquistas & Metas Realizadas]
    #for _ in range(5) { rule-line(colors, height: 5mm) }
  ]
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, below: 2.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.primary)[2. Desafios, Pendências & Pontos de Atenção]
    #for _ in range(5) { rule-line(colors, height: 5mm) }
  ]
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, below: 2.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.secondary)[3. Aprendizados, Destaques & Momentos de Gratidão]
    #for _ in range(5) { rule-line(colors, height: 5mm) }
  ]
  #block(stroke: colors.accent + 0.5pt, inset: 3mm, radius: 1.5mm)[
    #text(size: 8pt, weight: "bold", fill: colors.primary)[4. Ajustes & Direcionamento para o Próximo Mês]
    #for _ in range(5) { rule-line(colors, height: 5mm) }
  ]
]

// 8. Anotações Livres
#let section-anotacoes(colors, title: "Anotações & Ideias") = [
  #section-header(title, colors)
  #text(size: 8pt, fill: colors.secondary)[Espaço livre para registros, insights, projetos e reflexões]
  #v(2mm)
  #for _ in range(24) { dotted-line(colors, height: 6mm) }
]

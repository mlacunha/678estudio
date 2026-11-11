#let rule-line(colors, height: 6mm) = {
  block(width: 100%, height: height, above: 0pt, below: 0pt)[
    #place(bottom, line(length: 100%, stroke: colors.lines + 0.3pt))
  ]
}

#let dotted-line(colors, height: 6mm) = {
  block(width: 100%, height: height, above: 0pt, below: 0pt)[
    #place(bottom, line(length: 100%, stroke: (paint: colors.lines, thickness: 0.4pt, dash: "dotted")))
  ]
}

#let section-header(title, colors, subtitle: none) = [
  #let h-font = if colors.at("headingFont", default: none) != none { colors.headingFont } else { auto }
  #block(width: 100%, below: 4mm)[
    #text(size: 16pt, weight: "bold", fill: colors.primary, font: h-font, title)
    #if subtitle != none [
      #h(4pt) · #text(size: 10pt, fill: colors.secondary, subtitle)
    ]
    #v(1.5mm)
    #line(length: 100%, stroke: colors.accent + 1pt)
  ]
]

// 1. Abertura e Identificação Pessoal
#let section-abertura(colors, personalizationName: none, year: none, mode: "dated") = [
  #let h-font = if colors.at("headingFont", default: none) != none { colors.headingFont } else { auto }
  #v(20mm)
  #align(center)[
    #text(size: 26pt, weight: "light", fill: colors.primary, font: h-font)[PLANNER] \
    #text(size: 14pt, weight: "medium", fill: colors.accent, font: h-font)[ESSENCIAL]
    #v(3mm)
    #if mode == "dated" and year != none [
      #text(size: 12pt, fill: colors.secondary)[Edição Oficial · #str(year)]
    ] else [
      #text(size: 11pt, fill: colors.secondary)[Edição Permanente · Atemporal]
    ]
  ]
  #v(18mm)
  #block(stroke: colors.lines + 0.6pt, inset: 5mm, radius: 2mm, width: 100%)[
    #text(size: 10pt, weight: "bold", fill: colors.primary)[Identificação do Proprietário]
    #v(3mm)
    #text(size: 8pt, fill: colors.secondary)[Nome Completo:]
    #if personalizationName != none and personalizationName != "" [
      #text(size: 11pt, weight: "bold", fill: colors.primary)[ #personalizationName]
    ]
    #rule-line(colors, height: 5mm)
    #v(2mm)
    #text(size: 8pt, fill: colors.secondary)[Telefone / WhatsApp:]
    #rule-line(colors, height: 5mm)
    #v(2mm)
    #text(size: 8pt, fill: colors.secondary)[E-mail:]
    #rule-line(colors, height: 5mm)
    #v(2mm)
    #text(size: 8pt, fill: colors.secondary)[Objetivo Principal do Período:]
    #rule-line(colors, height: 5mm)
    #rule-line(colors, height: 5mm)
  ]
]

// 2. Planejamento Anual
#let section-anual(colors, year: none, mode: "dated") = [
  #section-header("Planejamento Anual", colors, subtitle: if mode == "dated" and year != none { str(year) } else { "Metas & Visão" })
  #text(size: 8pt, fill: colors.secondary)[Definição de objetivos macro e direcionamento estratégico]
  #v(3mm)
  #grid(columns: (1fr, 1fr), gutter: 4mm,
    block(stroke: colors.lines + 0.4pt, inset: 3.5mm, radius: 1.5mm)[
      #text(size: 9pt, weight: "bold", fill: colors.primary)[Objetivos Profissionais & Carreira]
      #for _ in range(4) { rule-line(colors, height: 6mm) }
    ],
    block(stroke: colors.lines + 0.4pt, inset: 3.5mm, radius: 1.5mm)[
      #text(size: 9pt, weight: "bold", fill: colors.primary)[Objetivos Pessoais & Bem-Estar]
      #for _ in range(4) { rule-line(colors, height: 6mm) }
    ],
    block(stroke: colors.lines + 0.4pt, inset: 3.5mm, radius: 1.5mm)[
      #text(size: 9pt, weight: "bold", fill: colors.primary)[Metas Financeiras do Ano]
      #for _ in range(4) { rule-line(colors, height: 6mm) }
    ],
    block(stroke: colors.lines + 0.4pt, inset: 3.5mm, radius: 1.5mm)[
      #text(size: 9pt, weight: "bold", fill: colors.primary)[Projetos & Aprendizados]
      #for _ in range(4) { rule-line(colors, height: 6mm) }
    ]
  )
  #v(4mm)
  #text(size: 9pt, weight: "bold", fill: colors.primary)[Principais Entregas Trimestrais]
  #for _ in range(3) { rule-line(colors, height: 6.5mm) }
]

// 3. Planejamento Mensal
#let section-mensal(monthName, colors, year: none, mode: "dated") = [
  #section-header("Visão Mensal", colors, subtitle: monthName + if mode == "dated" and year != none { " · " + str(year) } else { "" })
  #grid(columns: (1.2fr, 1fr), gutter: 4mm,
    block[
      #text(size: 9pt, weight: "bold", fill: colors.primary)[Prioridades Máximas do Mês]
      #for i in range(1, 5) [
        #grid(columns: (4mm, 1fr), gutter: 2mm, align: horizon,
          rect(width: 3.5mm, height: 3.5mm, stroke: colors.secondary + 0.5pt, radius: 0.5mm),
          rule-line(colors, height: 6mm)
        )
      ]
      #v(3mm)
      #text(size: 9pt, weight: "bold", fill: colors.primary)[Compromissos & Prazos Importantes]
      #for _ in range(5) { rule-line(colors, height: 6mm) }
    ],
    block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm)[
      #text(size: 8.5pt, weight: "bold", fill: colors.secondary)[Mini Calendário do Mês]
      #v(2mm)
      #table(columns: (1fr,) * 7, inset: 2pt, align: center, stroke: none,
        text(size: 6pt, weight: "bold", fill: colors.accent)[S],
        text(size: 6pt, weight: "bold", fill: colors.accent)[T],
        text(size: 6pt, weight: "bold", fill: colors.accent)[Q],
        text(size: 6pt, weight: "bold", fill: colors.accent)[Q],
        text(size: 6pt, weight: "bold", fill: colors.accent)[S],
        text(size: 6pt, weight: "bold", fill: colors.accent)[S],
        text(size: 6pt, weight: "bold", fill: colors.accent)[D],
        ..range(35).map(idx => text(size: 6pt, fill: colors.primary)[#if idx < 30 { str(idx + 1) } else { "" }])
      )
      #v(3mm)
      #text(size: 8pt, weight: "bold", fill: colors.primary)[Foco & Intenção:]
      #for _ in range(4) { dotted-line(colors, height: 5.5mm) }
    ]
  )
]

// 4. Planejamento Semanal (Página Esquerda: Seg, Ter, Qua + Prioridades)
#let section-semanal-left(colors, weekInfo: none, monthName: "Mês") = [
  #let week-title = if weekInfo != none and weekInfo.at("weekNumber", default: none) != none {
    "Semana " + str(weekInfo.weekNumber)
  } else {
    "Semana"
  }
  #section-header(week-title, colors, subtitle: monthName + " · Foco & Início")
  #block(stroke: colors.lines + 0.4pt, inset: 2.5mm, radius: 1.5mm, width: 100%, below: 3mm)[
    #text(size: 8pt, weight: "bold", fill: colors.accent)[Prioridades da Semana (Top 3)]
    #grid(columns: (4mm, 1fr), gutter: 2mm, align: horizon,
      rect(width: 3mm, height: 3mm, stroke: colors.secondary + 0.5pt, radius: 0.5mm), rule-line(colors, height: 5mm),
      rect(width: 3mm, height: 3mm, stroke: colors.secondary + 0.5pt, radius: 0.5mm), rule-line(colors, height: 5mm),
      rect(width: 3mm, height: 3mm, stroke: colors.secondary + 0.5pt, radius: 0.5mm), rule-line(colors, height: 5mm),
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
    #block(stroke: colors.lines + 0.3pt, inset: 2.5mm, radius: 1mm, width: 100%, below: 2.5mm)[
      #text(size: 8.5pt, weight: "bold", fill: colors.primary, label)
      #for _ in range(3) { dotted-line(colors, height: 5mm) }
    ]
  ]
]

// 4. Planejamento Semanal (Página Direita: Qui, Sex, Sab, Dom + Tarefas)
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
    #block(stroke: colors.lines + 0.3pt, inset: 2.5mm, radius: 1mm, width: 100%, below: 2mm)[
      #text(size: 8.5pt, weight: "bold", fill: colors.primary, label)
      #for _ in range(2) { dotted-line(colors, height: 5mm) }
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

  #grid(columns: (1fr, 1fr), gutter: 2mm,
    block(stroke: colors.lines + 0.3pt, inset: 2mm, radius: 1mm)[
      #text(size: 8pt, weight: "bold", fill: colors.primary, label-sab)
      #for _ in range(2) { dotted-line(colors, height: 5mm) }
    ],
    block(stroke: colors.lines + 0.3pt, inset: 2mm, radius: 1mm)[
      #text(size: 8pt, weight: "bold", fill: colors.primary, label-dom)
      #for _ in range(2) { dotted-line(colors, height: 5mm) }
    ]
  )
  #v(2mm)
  #block(stroke: colors.lines + 0.4pt, inset: 2.5mm, radius: 1.5mm, width: 100%)[
    #text(size: 8pt, weight: "bold", fill: colors.accent)[Tarefas & Pendências da Semana]
    #for _ in range(3) [
      #grid(columns: (3.5mm, 1fr), gutter: 2mm, align: horizon,
        circle(radius: 1.5mm, stroke: colors.secondary + 0.5pt),
        rule-line(colors, height: 4.5mm)
      )
    ]
  ]
]

// 5. Controle de Hábitos (Habit Tracker)
#let section-habitos(monthName, colors, mode: "dated") = [
  #section-header("Controle de Hábitos", colors, subtitle: monthName)
  #text(size: 8pt, fill: colors.secondary)[Acompanhamento diário de constância e disciplina (31 dias)]
  #v(2mm)
  #let habit-row(name) = (
    text(size: 7.5pt, weight: "medium", fill: colors.primary, name),
    ..range(31).map(_ => circle(radius: 1.3mm, stroke: colors.lines + 0.4pt))
  )
  #table(
    columns: (28mm, ..(1fr,) * 31),
    inset: 2pt,
    align: center + horizon,
    stroke: colors.lines + 0.2pt,
    table.header(
      text(size: 7pt, weight: "bold", fill: colors.accent)[Hábito / Meta],
      ..range(1, 32).map(d => text(size: 5pt, fill: colors.secondary)[#d])
    ),
    ..habit-row("Leitura (20 min)"),
    ..habit-row("Exercício Físico"),
    ..habit-row("Ingestão de Água"),
    ..habit-row("Planejar Dia Seguinte"),
    ..habit-row("Sono Regular (8h)"),
    ..habit-row("Sem Telas à Noite"),
  )
  #v(4mm)
  #text(size: 8.5pt, weight: "bold", fill: colors.primary)[Avaliação de Progresso do Mês:]
  #for _ in range(3) { rule-line(colors, height: 6mm) }
]

// 2. Metas Anuais & Visão Estratégica (Página oposta ao Planejamento Anual)
#let section-anual-metas(colors, year: 2027, mode: "dated") = [
  #let title-ano = if mode == "dated" { "Metas Estratégicas " + str(year) } else { "Metas & Objetivos Anuais" }
  #section-header(title-ano, colors, subtitle: "Direcionamento e Conquistas Prioritárias")
  #v(2mm)
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, below: 3.5mm)[
    #text(size: 8.5pt, weight: "bold", fill: colors.accent)[1. Objetivos Pessoais & Bem-Estar]
    #for _ in range(4) { rule-line(colors, height: 6mm) }
  ]
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, below: 3.5mm)[
    #text(size: 8.5pt, weight: "bold", fill: colors.secondary)[2. Objetivos Profissionais & Carreira]
    #for _ in range(4) { rule-line(colors, height: 6mm) }
  ]
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, below: 3.5mm)[
    #text(size: 8.5pt, weight: "bold", fill: colors.primary)[3. Metas Financeiras & Investimentos do Ano]
    #for _ in range(4) { rule-line(colors, height: 6mm) }
  ]
  #block(stroke: colors.accent + 0.5pt, inset: 3mm, radius: 1.5mm)[
    #text(size: 8.5pt, weight: "bold", fill: colors.primary)[4. Projetos Especiais & Grandes Conquistas]
    #for _ in range(4) { rule-line(colors, height: 6mm) }
  ]
]

// 6. Controle Financeiro Completo (Página Única para prévias e legibilidade compacta)
#let section-financeiro(monthName, colors, mode: "dated") = [
  #section-header("Controle Financeiro", colors, subtitle: monthName)
  #text(size: 8pt, fill: colors.secondary)[Gestão prática mensal de entradas, saídas e compromissos]
  #v(2mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[1. Receitas & Entradas Previstas]
  #table(
    columns: (1fr, 22mm, 22mm),
    inset: 3pt,
    align: (left, right, right),
    stroke: colors.lines + 0.3pt,
    table.header([*Fonte / Descrição*], [*Previsto*], [*Realizado*]),
    [Salário / Pró-labore], [], [],
    [Projetos Extras / Comissões], [], [],
    [Rendimentos / Outros], [], [],
  )
  #v(2mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[2. Despesas & Contas a Pagar / Pagas]
  #table(
    columns: (1fr, 20mm, 18mm, 15mm),
    inset: 3pt,
    align: (left, center, right, center),
    stroke: colors.lines + 0.3pt,
    table.header([*Descrição da Despesa*], [*Vencimento*], [*Valor (R\$)*], [*Pago?*]),
    [Moradia / Aluguel / Condomínio], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Energia / Água / Internet], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Alimentação & Mercado], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Transporte / Combustível], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Saúde / Farmácia / Seguro], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Cartão de Crédito / Parcelas], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
  )
  #v(2mm)
  #block(stroke: colors.accent + 0.6pt, inset: 2.5mm, radius: 1.5mm, fill: colors.lines.transparentize(85%))[
    #grid(columns: (1fr, 1fr, 1fr), align: center,
      [#text(size: 7.5pt, fill: colors.secondary)[Total Receitas:] \ #rule-line(colors, height: 4mm)],
      [#text(size: 7.5pt, fill: colors.secondary)[Total Despesas:] \ #rule-line(colors, height: 4mm)],
      [#text(size: 7.5pt, weight: "bold", fill: colors.primary)[Saldo Líquido:] \ #rule-line(colors, height: 4mm)]
    )
  ]
]

// 6. Controle Financeiro - Página Esquerda (Receitas & Despesas Fixas)
#let section-financeiro-left(monthName, colors, mode: "dated") = [
  #section-header("Controle Financeiro", colors, subtitle: monthName + " · Entradas & Despesas Fixas")
  #v(1mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[1. Receitas & Fontes de Renda]
  #table(
    columns: (1fr, 24mm, 24mm),
    inset: 3.5pt,
    align: (left, right, right),
    stroke: colors.lines + 0.3pt,
    table.header([*Fonte de Receita*], [*Previsto R\$*], [*Realizado R\$*]),
    [Salário / Remuneração Principal], [], [],
    [Projetos Extras / Freelances], [], [],
    [Rendimentos / Aluguéis / Outros], [], [],
    [Receita Extra / Reembolsos], [], [],
    [Outras Entradas], [], [],
  )
  #v(3mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[2. Despesas Fixas & Moradia]
  #table(
    columns: (1fr, 22mm, 20mm, 15mm),
    inset: 3.2pt,
    align: (left, center, right, center),
    stroke: colors.lines + 0.3pt,
    table.header([*Despesa Fixa*], [*Vencimento*], [*Valor (R\$)*], [*Pago?*]),
    [Moradia / Aluguel / Condomínio], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Energia Elétrica / Gás], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Água & Saneamento], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Internet / TV / Telefonia], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Saúde / Plano / Medicamentos], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Educação / Cursos / Mensalidades], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Seguros & Taxas Bancárias], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Outros Compromissos Fixos], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
  )
]

// 6. Controle Financeiro - Página Direita (Despesas Variáveis, Metas & Balanço)
#let section-financeiro-right(monthName, colors, mode: "dated") = [
  #section-header("Controle Financeiro", colors, subtitle: monthName + " · Variáveis & Resumo")
  #v(1mm)
  #text(size: 8pt, weight: "bold", fill: colors.accent)[3. Despesas Variáveis & Cartões de Crédito]
  #table(
    columns: (1fr, 22mm, 20mm, 15mm),
    inset: 3.2pt,
    align: (left, center, right, center),
    stroke: colors.lines + 0.3pt,
    table.header([*Despesa / Categoria*], [*Vencimento*], [*Valor (R\$)*], [*Pago?*]),
    [Alimentação & Supermercado], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Transporte / Combustível / Uber], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Cartão de Crédito - Fatura 1], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Cartão de Crédito - Fatura 2], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Lazer / Restaurantes / Passeios], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Vestuário & Cuidados Pessoais], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Assinaturas & Serviços Digitais], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
    [Imprevistos / Manutenção], [], [], [ #rect(width: 2.5mm, height: 2.5mm, stroke: colors.secondary + 0.5pt) ],
  )
  #v(2.5mm)
  #text(size: 8pt, weight: "bold", fill: colors.secondary)[4. Metas de Economia & Investimentos]
  #table(
    columns: (1fr, 24mm, 24mm),
    inset: 3pt,
    align: (left, right, right),
    stroke: colors.lines + 0.3pt,
    table.header([*Meta Financeira*], [*Meta R\$*], [*Aporte R\$*]),
    [Reserva de Emergência], [], [],
    [Aportes de Investimento / Poupança], [], [],
  )
  #v(2.5mm)
  #block(stroke: colors.accent + 0.6pt, inset: 2.5mm, radius: 1.5mm, fill: colors.lines.transparentize(85%))[
    #grid(columns: (1fr, 1fr, 1fr), align: center,
      [#text(size: 7.5pt, fill: colors.secondary)[Total Receitas:] \ #rule-line(colors, height: 4.5mm)],
      [#text(size: 7.5pt, fill: colors.secondary)[Total Despesas:] \ #rule-line(colors, height: 4.5mm)],
      [#text(size: 7.5pt, weight: "bold", fill: colors.primary)[Saldo Líquido:] \ #rule-line(colors, height: 4.5mm)]
    )
  ]
]

// 7. Revisão Mensal
#let section-revisao(monthName, colors, mode: "dated") = [
  #section-header("Revisão Mensal", colors, subtitle: monthName + " · Balanço")
  #text(size: 8pt, fill: colors.secondary)[Análise de desempenho, aprendizados e calibragem para o próximo ciclo]
  #v(3mm)
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, below: 3mm)[
    #text(size: 8.5pt, weight: "bold", fill: colors.primary)[Principais Vitórias & Metas Concluídas]
    #for _ in range(3) { rule-line(colors, height: 5.5mm) }
  ]
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm, below: 3mm)[
    #text(size: 8.5pt, weight: "bold", fill: colors.primary)[Pendências & Dificuldades Encontradas]
    #for _ in range(3) { rule-line(colors, height: 5.5mm) }
  ]
  #block(stroke: colors.lines + 0.4pt, inset: 3mm, radius: 1.5mm)[
    #text(size: 8.5pt, weight: "bold", fill: colors.primary)[Lições Aprendidas & Ajustes para o Próximo Mês]
    #for _ in range(4) { rule-line(colors, height: 5.5mm) }
  ]
]

// 8. Anotações Livres
#let section-anotacoes(colors, title: "Anotações & Ideias") = [
  #section-header(title, colors)
  #text(size: 8pt, fill: colors.secondary)[Espaço livre para registros, insights e reflexões]
  #v(2mm)
  #for _ in range(18) { dotted-line(colors, height: 6.5mm) }
]


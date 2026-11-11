# Perguntas para Validação — 678 Estudio

> Gerado pelo Reviewer em 2026-11-11

---

## Pergunta 1

**Contexto:** Rotas administrativas em `src/pages/admin/` e mutações REST em `src/pages/api/products/[id].ts`
**Spec afetada:** [`_reversa_sdd/admin/requirements.md`](file:///d:/Projetos/site678Estudio/_reversa_sdd/admin/requirements.md), [`_reversa_sdd/permissions.md`](file:///d:/Projetos/site678Estudio/_reversa_sdd/permissions.md)
**Pergunta:** As rotas administrativas atualmente dependem de segurança externa de borda (ex: Cloudflare Access / Zero Trust ou Nginx). Devemos implementar um middleware interno no Astro com login/senha e cookie de sessão seguro, ou a segurança perimetral do servidor é suficiente?
**Impacto:** Se interno, exigirá tabela de usuários com hash bcrypt e tela de login em `/admin/login`. Se perimetral, as specs registram a responsabilidade na camada de infraestrutura.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 2

**Contexto:** Armazenamento de mockups temporários em `/api/mockup/save` e prévias em `agenda_quote_assets`
**Spec afetada:** [`_reversa_sdd/customizer-caneca-3d/design.md`](file:///d:/Projetos/site678Estudio/_reversa_sdd/customizer-caneca-3d/design.md), [`_reversa_sdd/agenda-compiler/design.md`](file:///d:/Projetos/site678Estudio/_reversa_sdd/agenda-compiler/design.md)
**Pergunta:** Qual deve ser a política de retenção para imagens de mockups e ativos de orçamentos gerados por clientes? Devemos manter indefinidamente ou aplicar expiração/limpeza automática após 30 ou 60 dias?
**Impacto:** Define se uma rotina de limpeza agendada (cron) é necessária para evitar crescimento indefinido do disco.

**Resposta:** <!-- preencha aqui -->

---

## Pergunta 3

**Contexto:** Dependência externa do executável Typst em `src/server/agenda/classic.mjs`
**Spec afetada:** [`_reversa_sdd/agenda-compiler/requirements.md`](file:///d:/Projetos/site678Estudio/_reversa_sdd/agenda-compiler/requirements.md)
**Pergunta:** Em ambientes onde o binário do Typst não puder ser instalado, o produto "Agenda Clássica" deve ser ocultado do catálogo automaticamente ou exibir um alerta de serviço temporariamente indisponível?
**Impacto:** Define o comportamento de degradação graciosa da vitrine de papelaria personalizada.

**Resposta:** <!-- preencha aqui -->


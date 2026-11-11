# Matriz de Permissões e Perfis de Acesso (RBAC/ACL) — 678 Estudio

Documento consolidado gerado na Fase de Interpretação pelo Detective.

---

## 1. Perfis de Usuário (Personas)

1. **Visitante Público / Cliente (`public_user`)**: Usuário anônimo acessando o site institucional, personalizadores e vitrine de produtos.
2. **Administrador do Estúdio (`studio_admin`)**: Responsável pela operação, catálogo de produtos, fotos de portfólio, atendimento e gestão de orçamentos.
3. **Sistema / Motor de Tarefas (`system_worker`)**: Processos automatizados de compilação Typst, rotinas de backup e persistência em banco.

---

## 2. Matriz de Permissões

| Recurso / Ação | Visitante Público | Administrador | Motor / Sistema | Notas de Segurança |
|---|:---:|:---:|:---:|---|
| **Visualizar Home e Catálogo** | ✅ Permitido | ✅ Permitido | ✅ Permitido | Apenas itens com `is_active = 1` |
| **Personalizar Caneca 3D** | ✅ Permitido | ✅ Permitido | - | Execução WebGL no navegador do cliente |
| **Personalizar Quadro no Ambiente** | ✅ Permitido | ✅ Permitido | - | Execução Canvas 2D no cliente |
| **Exportar Mockup de Orçamento** | ✅ Permitido | ✅ Permitido | - | Rate-limiting e sanitização de payload |
| **Compilar Prévias de Agenda (Typst)** | ✅ Permitido | ✅ Permitido | ✅ Permitido | Execução isolada em pasta temporária descartável |
| **Solicitar Orçamento de Agenda** | ✅ Permitido | ✅ Permitido | - | Gravação com `draft_token` em `agenda_quotes` |
| **Acessar `/admin` e Subrotas** | ❌ Negado | ✅ Permitido | - | Acesso restrito ao operador |
| **Criar/Editar/Excluir Produtos** | ❌ Negado | ✅ Permitido | - | Operações via `/api/products` protegidas |
| **Editar Contatos e Redes Sociais** | ❌ Negado | ✅ Permitido | - | Escrita exclusiva na tabela `site_settings` |
| **Visualizar Cotações de Clientes** | ❌ Negado | ✅ Permitido | - | Consulta a dados de contato e logos de clientes |
| **Publicar Trabalhos no Portfólio** | ❌ Negado | ✅ Permitido | - | Gestão de `gallery_works` e fotos |
| **Executar/Restaurar Backups SQLite** | ❌ Negado | ✅ Permitido | ✅ Permitido | Rota crítica `/admin/backup` |


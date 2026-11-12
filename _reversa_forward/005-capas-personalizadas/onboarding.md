# Onboarding: Homologação e Uso da Feature 005 (Capas Personalizadas)

> Identificador: `005-capas-personalizadas`
> Data: `2026-11-12`

Este guia descreve os passos práticos para testar a funcionalidade completa após sua implementação.

## 1. Teste de Personalização no Navegador

1. Inicie o servidor localmente (`pnpm dev` ou modo preview).
2. Acesse qualquer um dos três personalizadores:
   - `/personalizar/caderno`
   - `/personalizar/agenda`
   - `/personalizar/planner`
3. Observe as abas no topo do formulário:
   - Clique em **"1. Capa e Contracapa"**.
   - Alterne entre os estilos: **Clássica**, **Moderna** e **Fotográfica**.
   - Modifique o título e o nome personalizado; observe a prévia visual atualizar em tempo real.
   - Escolha o estilo **Fotográfica** e faça o upload de uma imagem própria (PNG ou JPEG).
   - Ajuste os controles de zoom e enquadramento.
   - Alterne entre a visualização de **Arte Plana** e o **Mockup do Produto Encadernado**.
4. Clique na aba **"2. Miolo e Conteúdo"** e configure o miolo normalmente.
5. Clique em **"Solicitar orçamento no WhatsApp"**.

## 2. Teste do Painel Administrativo

1. Acesse o painel de administração correspondente (ex: `/admin/cadernos`).
2. Abra a solicitação recém-criada.
3. Verifique na seção de Capas:
   - Exibição da miniatura da capa frontal e contracapa.
   - Download da imagem original em alta resolução enviada pelo cliente.
4. Teste a geração dos arquivos de produção gráfica:
   - Clique em **"Baixar Capa A5 (3mm)"** e verifique no leitor de PDF a presença das marcas de corte e sangria.
   - Clique em **"Baixar Capa A5 (5mm)"** e confirme a área de sangria ampliada.
   - Clique em **"Baixar Folha Combinada A4"** e verifique no leitor de PDF se a Capa e a Contracapa estão dispostas lado a lado na orientação paisagem com a linha guia de corte central milimétrica para corte ao meio sem dobras.


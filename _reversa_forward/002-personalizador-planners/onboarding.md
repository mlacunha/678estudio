# Onboarding e Roteiro de Validação Humana: Personalizador de Planners

> Feature: `002-personalizador-planners`

## Roteiro de Teste e Validação

### 1. Acesso ao Personalizador
1. Na página inicial (`/`), role até a seção **Papelaria Personalizada**.
2. Verifique que existem exatamente os três cards principais: **Agendas**, **Planners** e **Cadernos Personalizados**.
3. Clique no botão de personalização do card **Planners** e confirme o redirecionamento para `/personalizar/planner`.

### 2. Configuração e Prévias
4. No formulário, selecione a modalidade **Datado** e ano corrente.
5. Alterne entre os estilos visuais (**Clássico**, **Comercial**, **Feminino**) e confirme que as amostras de páginas reais atualizam de acordo.
6. Na galeria de prévias, navegue entre as 8 seções funcionais:
   - Abertura e identificação
   - Planejamento anual
   - Planejamento mensal
   - Planejamento semanal
   - Controle de hábitos
   - Controle financeiro
   - Revisão mensal
   - Anotações
7. Teste a opção de zoom nas páginas para verificar nitidez, alinhamento de texto e margens.

### 3. Modalidade Não Datada
8. Alterne para a modalidade **Não Datado**.
9. Verifique se o seletor de ano é ocultado e se as prévias passam a exibir grids com espaços para preenchimento manual das datas.

### 4. Solicitação de Orçamento
10. Preencha nome de personalização, anexe uma imagem de exemplo e clique em **Solicitar Orçamento via WhatsApp**.
11. Confirme a geração do pedido e a abertura do link do WhatsApp com a referência formatada.

### 5. Gestão Administrativa
12. Acesse a rota de administração do pedido gerado e faça o download do PDF completo em A5.
13. Abra o PDF e verifique a paginação contínua, margens de encadernação e ausência de páginas em branco incorretas.


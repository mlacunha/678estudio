# Personalizador 3D de Canecas — Design Técnico

> Especificação técnica da unit `customizer-caneca-3d`. Foca no COMO a unit é construída.

## Interface

### Componentes e Páginas
- `src/pages/personalizar/caneca.astro`: Página de rota SSR que embute o layout e o componente `Mug.astro`.
- `src/components/customizers/Mug.astro`: Elementos de interface, controles de personalização e scripts Three.js cliente.

### Módulos Utilitários (`src/utils/customizer.ts`)

| Símbolo | Assinatura | Retorno | Observação |
|---|---|---|---|
| `getMugPrintBand` | `(widthCm: MugPrintWidth)` | `{ height, thetaStart, thetaLength }` | Converte medidas em centímetros para arco cilíndrico radiano |
| `clampValue` | `(value, min, max)` | `number` | Limita valor a um intervalo fechado |
| `calculateBoundedOffset` | `(offset, range)` | `number` | Restringe deslocamento de arte |
| `buildMockupWhatsAppMessage` | `(title, mockupUrl)` | `string` | Constrói mensagem de orçamento personalizada |

## Pipeline de Renderização 3D (Three.js)
1. **Inicialização da Cena**:
   - `THREE.PerspectiveCamera` com FOV de 35°.
   - `THREE.WebGLRenderer` com `antialias: true` e preservação de drawing buffer.
   - Iluminação: `AmbientLight` suave e `DirectionalLight` simulando luz de estúdio fotográfico.
2. **Criação da Geometria da Caneca**:
   - Cilindro cerâmico branco (`CylinderGeometry`).
   - Alça de caneca utilizando toroide ou malha curva extrudada no eixo $+X$.
3. **Mapeamento UV e Texturização**:
   - Um canvas 2D oculto (`mug-texture-canvas`) renderiza a arte recortada e ajustada.
   - A textura é vinculada como `CanvasTexture` no material `MeshStandardMaterial`.
   - `getMugPrintBand` ajusta `thetaStart` e `thetaLength` na malha para que a arte cubra exatamente o arco desejado sem atingir a alça.

## Riscos e Lacunas
- 🟡 Em dispositivos sem WebGL ativo, o sistema exibe mensagem de fallback e mantém o mapa planificado 2D.
- 🟡 Ausência de limpeza automática de mockups antigos salvos em `/api/mockup/save`.


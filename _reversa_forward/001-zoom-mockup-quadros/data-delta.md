# Data Delta: Zoom no Mockup de Quadros

> Identificador: `001-zoom-mockup-quadros`

## 1. Modelo Relacional e Persistência
- **Tabelas do Banco de Dados SQLite (`studio678.db`)**: Nenhuma alteração.
- **Campos Novos**: Nenhum.
- **Campos Modificados**: Nenhum.
- **Migrações Necessárias**: Nenhuma (`schema_migrations` inalterada).

## 2. Estado em Memória / Client-side
O estado de zoom e pan é estritamente volátil e vive no ciclo de vida do modal aberto em `Frame.astro`:

```typescript
interface MockupZoomState {
  isOpen: boolean;
  scale: number;       // 1.0 a 4.0 (padrão: 1.0)
  translateX: number;  // em pixels
  translateY: number;  // em pixels
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  initialPinchDist: number | null;
}
```

Ao fechar o modal, os valores de `scale`, `translateX` e `translateY` são redefinidos para os valores padrão (`scale = 1.0`, `translateX = 0`, `translateY = 0`), garantindo que uma reabertura futura inicie sempre no estado de visão geral.


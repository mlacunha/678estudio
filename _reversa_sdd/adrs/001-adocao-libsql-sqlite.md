# ADR-001: Adoção do @libsql/client para Persistência SQLite Local

- **Status**: Aceito (Retroativo)
- **Data**: 2026-11-06
- **Autor**: Milton / Equipe 678 Estudio

## Contexto
O catálogo de produtos e as configurações do 678 Estudio necessitavam de persistência estruturada local com transações ACID, sem a sobrecarga ou custo de servidores de banco dedicados externos para a escala inicial. O driver tradicional `better-sqlite3` apresentou bloqueios frequentes em ambiente Windows com `pnpm` devido à compilação de binários nativos C++ (`.node`) e regras rígidas de ciclo de build.

## Decisão
Adotar `@libsql/client` (driver SDK compatível com Turso/SQLite) acessando o arquivo local `data/studio678.db` (`url: file:data/studio678.db`). Toda interação passa por queries parametrizadas (`client.execute({ sql, args })`) e batches transacionais.

## Consequências
- **Positivas**: 
  - Compatibilidade imediata e limpa em ambientes Windows, Linux e macOS sem ferramentas de build C++.
  - API consistente com suporte assíncrono moderno e transações atômicas seguras (`client.transaction('write')`).
  - Caminho natural de migração para réplicas distribuídas na nuvem (Turso) caso o tráfego escale.
- **Negativas**:
  - Requer manuseio explícito de tipos ao extrair dados de `Row` e conversão manual de números/booleanos no SQLite.


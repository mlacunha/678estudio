# Baixa o binário oficial da arquitetura de destino sem depender de emulação.
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS typst
ARG TARGETARCH
RUN set -eux; \
  case "$TARGETARCH" in \
  amd64) arch=x86_64; sha=a6d077d0a95eed5a2eba715b2dae06be954f624ccbf85758a03f389ded33118c ;; \
  arm64) arch=aarch64; sha=5aa8d74a3d906e60ea12a66ac2f37f8eef1b14cbad7182a745e393a10c23dcee ;; \
  *) echo "Arquitetura Typst não suportada: $TARGETARCH" >&2; exit 1 ;; \
  esac; \
  apt-get update; \
  apt-get install -y --no-install-recommends ca-certificates curl xz-utils; \
  release="typst-${arch}-unknown-linux-musl"; \
  curl --fail --show-error --silent --location --retry 3 \
  "https://github.com/typst/typst/releases/download/v0.15.1/$release.tar.xz" -o /tmp/typst.tar.xz; \
  echo "$sha  /tmp/typst.tar.xz" | sha256sum -c -; \
  mkdir /typst; \
  tar -xJf /tmp/typst.tar.xz -C /typst --strip-components=1 \
  "$release/typst" "$release/LICENSE" "$release/NOTICE"

FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 \
  && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
WORKDIR /app
RUN npm install --global pnpm@10.29.3
COPY package.json pnpm-lock.yaml ./

FROM dependencies AS build
ENV ASTRO_TELEMETRY_DISABLED=1
RUN pnpm install --frozen-lockfile
COPY astro.config.mjs tailwind.config.mjs tsconfig.json vitest.config.ts ./
COPY src ./src
COPY public ./public
COPY --from=typst /typst/typst /usr/local/bin/typst
RUN --network=none AGENDA_TYPST_TEST=1 pnpm test && python3 -B src/server/backup/test_engine.py && pnpm exec astro check && pnpm build

FROM dependencies AS production-dependencies
RUN pnpm install --prod --frozen-lockfile

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321 ASTRO_TELEMETRY_DISABLED=1
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=typst /typst/typst /usr/local/bin/typst
COPY --from=typst /typst/LICENSE /typst/NOTICE /usr/local/share/doc/typst/
COPY --from=build /app/src/server/agenda ./src/server/agenda
COPY --from=build /app/src/server/backup/engine.py /app/src/server/backup/supervisor.mjs ./src/server/backup/
COPY --from=build /app/src/server/planner ./src/server/planner
COPY --from=build /app/src/server/caderno ./src/server/caderno
COPY --from=build /app/src/server/cover ./src/server/cover
RUN install -d -o node -g node /app/data /app/public/uploads
USER node
EXPOSE 4321
CMD ["node", "src/server/backup/supervisor.mjs"]

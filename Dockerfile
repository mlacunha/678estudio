FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
RUN npm install --global pnpm@10.29.3
COPY package.json pnpm-lock.yaml ./

FROM dependencies AS build
ENV ASTRO_TELEMETRY_DISABLED=1
RUN pnpm install --frozen-lockfile
COPY astro.config.mjs tailwind.config.mjs tsconfig.json vitest.config.ts ./
COPY src ./src
COPY public ./public
RUN pnpm test && pnpm exec astro check && pnpm build

FROM dependencies AS production-dependencies
RUN pnpm install --prod --frozen-lockfile

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321 ASTRO_TELEMETRY_DISABLED=1
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
RUN install -d -o node -g node /app/data /app/public/uploads
USER node
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]

FROM node:20-alpine AS build
WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/firebase/package.json packages/firebase/
COPY packages/database/package.json packages/database/
COPY apps/api apps/api
COPY packages/firebase packages/firebase
COPY packages/database packages/database
RUN pnpm install --filter api... --frozen-lockfile
RUN pnpm --filter api... run build

# Create a production-only bundle with node_modules flattened for runtime
RUN pnpm --filter @repo/api deploy --prod --legacy /app
RUN cp -r /workspace/apps/api/dist /app/dist

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 8080
CMD ["node", "dist/main"]

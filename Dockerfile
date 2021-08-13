# ---------- Base ----------
FROM node:14 as base

WORKDIR /app

# ---------- Builder ----------
# Creates:
# - node_modules: production dependencies (no dev dependencies)
# - dist: A production build compiled with Babel
FROM base AS builder

COPY ./ ./
# COPY package.json ./
# COPY yarn.lock ./
RUN yarn
RUN yarn lerna bootstrap
RUN yarn lerna run build

# # ---------- Release ----------
FROM base AS release

COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules

USER node
EXPOSE 3000
ENV NODE_ENV production
WORKDIR /app/server
CMD ["node", "./dist/index.js"]

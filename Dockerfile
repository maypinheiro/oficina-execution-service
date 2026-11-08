FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
RUN addgroup -S -g 10001 nodeapp && adduser -S -D -H -u 10001 -G nodeapp nodeapp
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build --chown=nodeapp:nodeapp /app/dist/src ./dist/src
USER 10001:10001
EXPOSE 3000
CMD ["node", "--import", "dd-trace/initialize.mjs", "dist/src/main.js"]

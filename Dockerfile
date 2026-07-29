FROM node:20-alpine

RUN apk add --no-cache python3 py3-pip
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY src ./src

RUN pnpm install --child-concurrency=4

RUN cd /app/src/server && pnpm build
RUN cd /app/src/client && pnpm build

EXPOSE 3000

CMD ["node", "src/server/dist/index.js"]
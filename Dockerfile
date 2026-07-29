FROM node:20-alpine

RUN python3 --version

RUN apk add --no-cache python3 py3-pip
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de configuración raíz
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copiar los package.json de todos los paquetes del monorepo
COPY src/server/package.json ./src/server/
COPY src/client/package.json ./src/client/
COPY src/shared/package.json ./src/shared/

# Instalar dependencias limitando la concurrencia para evitar saturar el socket de red
RUN pnpm install --child-concurrency=4

# Copiar el resto del código fuente
COPY . .

EXPOSE 3000

CMD ["pnpm", "--filter", "server", "start"]
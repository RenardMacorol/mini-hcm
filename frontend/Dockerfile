FROM node:20-alpine

# This tells the Alpine image to activate and use pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy the file you just created
COPY package*.json ./

RUN pnpm install
COPY . .

CMD ["pnpm", "start"]

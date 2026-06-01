FROM node:20-alpine

WORKDIR /app

# enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# copy dependency files first
COPY package.json pnpm-lock.yaml ./

# install dependencies (THIS is what you're missing)
RUN pnpm install

# copy rest of app
COPY . .

EXPOSE 5000

CMD ["pnpm", "exec", "nodemon", "server.js"]

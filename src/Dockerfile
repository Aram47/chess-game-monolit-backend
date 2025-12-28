FROM node:latest

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm ci

CMD ["npm", "run", "start:dev"]
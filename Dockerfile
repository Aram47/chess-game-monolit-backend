FROM node:latest

WORKDIR /app

COPY package*.json .

RUN npm ci --legacy-peer-deps

COPY . .

CMD ["npm", "run", "start:dev"]
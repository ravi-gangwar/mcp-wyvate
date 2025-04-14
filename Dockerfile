FROM node:alpine

WORKDIR /app

COPY tsconfig.json .
COPY package*.json ./

RUN npm install

COPY ./src ./src

RUN npm install -g typescript

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]

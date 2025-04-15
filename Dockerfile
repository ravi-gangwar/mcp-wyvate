FROM node:alpine

WORKDIR /app

COPY tsconfig.json .
COPY package*.json ./
COPY ecosystem.config.js ./

RUN npm install

COPY ./src ./src

RUN npm install -g typescript
RUN npm install -g pm2


RUN npm run build

EXPOSE 3000

CMD ["pm2-runtime", "ecosystem.config.js"]

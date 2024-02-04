FROM node:20-bookworm-slim

WORKDIR /var/www

COPY ./frontend/package.json ./
RUN npm i
COPY ./frontend ./

EXPOSE 3000

CMD npm run start

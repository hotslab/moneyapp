FROM node:20-bookworm-slim

WORKDIR /var/www

# COPY backend.env ./.env
COPY ./backend/package.json ./
RUN npm i
COPY ./backend ./

EXPOSE 3333

CMD npm run dev
FROM node:20-bookworm-slim

RUN apt-get update && DEBIAN_FRONTEND=noninteractive ACCEPT_EULA=Y apt-get install -y --fix-missing supervisor

WORKDIR /var/www

# COPY backend.env ./.env
COPY ./backend/package*.json ./
RUN npm i
COPY ./backend ./

EXPOSE 3333

ADD backend-supervisor.conf /etc/supervisor/conf.d/backend-supervisor.conf

RUN mkdir -p /var/log/supervisor

CMD /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf

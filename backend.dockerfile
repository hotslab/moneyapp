FROM node:20.11.1-bookworm-slim

RUN apt-get update && DEBIAN_FRONTEND=noninteractive ACCEPT_EULA=Y apt-get install -y --fix-missing supervisor

WORKDIR /var/www

COPY ./backend/package.json ./
COPY ./backend/package-lock.json ./

RUN npm ci --maxsockets 1 --loglevel verbose --cache /root/.npm

COPY ./backend ./

RUN node ace build --no-assets

ADD backend-supervisor.conf /etc/supervisor/conf.d/backend-supervisor.conf

RUN mkdir -p /var/log/supervisor

CMD /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf

FROM node:20-bookworm-slim

RUN apt-get update && DEBIAN_FRONTEND=noninteractive ACCEPT_EULA=Y apt-get install -y --fix-missing supervisor

WORKDIR /var/www

# COPY backend.env ./.env
COPY ./backend/package.json ./
# COPY ./backend/package-lock.json ./
# RUN npm i --loglevel verbose
# RUN --mount=type=cache,target=/root/.npm npm ci
RUN npm i --loglevel verbose --cache /root/.npm
COPY ./backend ./

ADD backend-supervisor.conf /etc/supervisor/conf.d/backend-supervisor.conf

RUN mkdir -p /var/log/supervisor

CMD /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf

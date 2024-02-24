FROM node:20.11.1-bookworm-slim

RUN apt-get update && DEBIAN_FRONTEND=noninteractive ACCEPT_EULA=Y apt-get install -y --fix-missing supervisor

RUN npm i --maxsockets 1 -g serve

WORKDIR /var/www

COPY ./frontend/package.json ./
COPY ./frontend/package-lock.json ./

RUN npm ci --maxsockets 1 --loglevel verbose --cache /root/.npm

COPY ./frontend ./

RUN npm run build

ADD frontend-supervisor.conf /etc/supervisor/conf.d/frontend-supervisor.conf

RUN mkdir -p /var/log/supervisor

CMD /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf

FROM node as builder

MAINTAINER Joel Day joel.day@microsoft.com

WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN npm run build

FROM mhart/alpine-node:10.8
#FROM node

WORKDIR /usr/src/app

#COPY --from=builder /usr/src/app/ .
COPY --from=builder /usr/src/app/dist/ ./dist/
COPY --from=builder /usr/src/app/server/ ./server/
COPY --from=builder /usr/src/app/server.js ./

RUN npm install express

EXPOSE 3000


CMD [ "node", "server.js" ]

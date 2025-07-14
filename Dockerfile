FROM node:lts-alpine as builder
WORKDIR /opt/app

RUN apk --no-cache add git
RUN apk add --no-cache -t build-dependencies bash make gcc g++ python3 libtool openssl-dev autoconf automake \
    && cd $(npm root -g)/npm \
    && npm install -g node-gyp

COPY package.json package-lock.json* /opt/app/

RUN npm ci

COPY src /opt/app/src
COPY config /opt/app/config
COPY test /opt/app/test

FROM node:lts-alpine
WORKDIR /opt/app

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: ml-user
RUN adduser -D ml-user
USER ml-user

COPY --chown=ml-user --from=builder /opt/app .
RUN npm prune --production

EXPOSE 3001
CMD ["npm", "run", "start"]
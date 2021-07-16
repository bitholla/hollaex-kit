# build environment
FROM node:12.18.3 as build
ENV NODE_OPTIONS=--max_old_space_size=3072
WORKDIR /app
COPY package.json /app/package.json
RUN npm config set unsafe-perm true && \
    npm install -g node-gyp && \
    npm install --loglevel=error
COPY . /app
RUN npm run build

FROM nginx:1.16.0-alpine
RUN apk add --update \
    curl \
    && rm -rf /var/cache/apk/*
COPY --from=build /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d
# Changing the user to 'nginx'
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]




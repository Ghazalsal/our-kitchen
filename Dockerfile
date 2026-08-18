FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN corepack enable && pnpm install --frozen-lockfile
COPY client ./client
COPY vite.config.ts tsconfig.json postcss.config.* ./
RUN pnpm build

FROM composer:2 AS dependencies
WORKDIR /app
COPY laravel/composer.json laravel/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts
COPY laravel ./
RUN composer dump-autoload --optimize --no-dev

FROM php:8.3-cli-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends libzip-dev ca-certificates \
    && docker-php-ext-install pdo_mysql zip \
    && printf 'upload_max_filesize=8M\npost_max_size=8M\n' > /usr/local/etc/php/conf.d/uploads.ini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY --from=dependencies /app ./
COPY --from=frontend /app/dist/public ./public
ENV APP_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-3000} -t public public/index.php"]

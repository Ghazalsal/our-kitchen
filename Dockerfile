FROM php:8.3-cli-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends curl git unzip libzip-dev ca-certificates \
    && docker-php-ext-install pdo_mysql zip \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN printf 'upload_max_filesize=8M\npost_max_size=8M\n' > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY . .

RUN cd laravel && composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader \
    && cd /app \
    && npm install -g corepack@latest \
    && corepack enable \
    && corepack pnpm install \
    && corepack pnpm run build \
    && cp -R dist/public/. laravel/public/

ENV APP_ENV=production \
    NODE_ENV=production
WORKDIR /app/laravel
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-3000} -t public public/index.php"]

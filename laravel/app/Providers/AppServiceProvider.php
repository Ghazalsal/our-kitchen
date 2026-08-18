<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use PDO;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (env('DATABASE_URL')) {
            config(['database.connections.mysql.options' => [
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA', '/etc/ssl/certs/ca-certificates.crt'),
            ]]);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}

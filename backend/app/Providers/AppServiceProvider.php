<?php

namespace App\Providers;

use App\Auth\TenantAwareEloquentUserProvider;
use App\Support\TenantManager;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(TenantManager::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::provider('tenant-eloquent', function ($app, array $config) {
            return new TenantAwareEloquentUserProvider($app['hash'], $config['model']);
        });
    }
}


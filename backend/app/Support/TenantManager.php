<?php

namespace App\Support;

use App\Models\Tenant;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class TenantManager
{
    public const SESSION_KEY = 'tenant_id';

    public const CONNECTION = 'tenant';

    protected ?Tenant $tenant = null;

    public function current(): ?Tenant
    {
        return $this->tenant;
    }

    public function use(Tenant $tenant): void
    {
        $this->tenant = $tenant;

        $default = (string) Config::get('database.default');
        $base = Config::get("database.connections.{$default}", []);

        $config = $base;
        $config['database'] = $this->connectionDatabase($tenant);

        Config::set('database.connections.'.self::CONNECTION, $config);
        DB::purge(self::CONNECTION);
        DB::reconnect(self::CONNECTION);
    }

    public function forget(): void
    {
        $this->tenant = null;
        DB::purge(self::CONNECTION);
    }

    public function connectionDatabase(Tenant $tenant): string
    {
        $default = (string) Config::get('database.default');
        $driver = Config::get("database.connections.{$default}.driver");

        if ($driver === 'sqlite') {
            return $this->sqlitePath($tenant);
        }

        return $tenant->database;
    }

    public function sqlitePath(Tenant $tenant): string
    {
        $directory = storage_path('framework/testing/tenants');

        if (! File::isDirectory($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        return $directory.DIRECTORY_SEPARATOR.$tenant->database.'.sqlite';
    }

    public function ensureDatabase(Tenant $tenant): void
    {
        $default = (string) Config::get('database.default');
        $driver = Config::get("database.connections.{$default}.driver");

        if ($driver === 'sqlite') {
            $path = $this->sqlitePath($tenant);

            if (! File::exists($path)) {
                File::put($path, '');
            }

            return;
        }

        $name = $tenant->database;
        $charset = Config::get("database.connections.{$default}.charset", 'utf8mb4');
        $collation = Config::get("database.connections.{$default}.collation", 'utf8mb4_unicode_ci');

        DB::connection($default)->statement(
            "CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET {$charset} COLLATE {$collation}"
        );
    }

    public function migrate(Tenant $tenant): void
    {
        $this->use($tenant);

        Artisan::call('migrate', [
            '--database' => self::CONNECTION,
            '--path' => 'database/migrations/tenant',
            '--force' => true,
        ]);
    }

    public function provision(Tenant $tenant): void
    {
        $this->ensureDatabase($tenant);
        $this->migrate($tenant);
    }

    public function dropDatabase(Tenant $tenant): void
    {
        $default = (string) Config::get('database.default');
        $driver = Config::get("database.connections.{$default}.driver");

        if ($driver === 'sqlite') {
            $path = $this->sqlitePath($tenant);

            if (File::exists($path)) {
                File::delete($path);
            }

            return;
        }

        DB::connection($default)->statement(
            'DROP DATABASE IF EXISTS `'.$tenant->database.'`'
        );
    }

    public static function databaseNameForSlug(string $slug): string
    {
        $prefix = (string) env('TENANT_DB_PREFIX', 'task_board');

        return $prefix.'_'.$slug;
    }
}

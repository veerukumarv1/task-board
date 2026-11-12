<?php

namespace Tests;

use App\Models\Tenant;
use App\Models\TenantUserIndex;
use App\Models\User;
use App\Support\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\File;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (in_array(RefreshDatabase::class, class_uses_recursive(static::class), true)) {
            $this->cleanTenantSqliteFiles();
        }
    }

    protected function tearDown(): void
    {
        if ($this->app?->bound(TenantManager::class)) {
            $this->app->make(TenantManager::class)->forget();
        }

        parent::tearDown();
    }

    /**
     * @param  array<string, mixed>  $tenantAttributes
     * @param  array<string, mixed>  $userAttributes
     * @return array{0: Tenant, 1: User}
     */
    protected function provisionTenantWithUser(array $tenantAttributes = [], array $userAttributes = []): array
    {
        $tenant = Tenant::factory()->create($tenantAttributes);
        $manager = $this->tenants();
        $manager->provision($tenant);
        $manager->use($tenant);

        $user = User::factory()->create($userAttributes);

        TenantUserIndex::query()->create([
            'email' => $user->email,
            'tenant_id' => $tenant->id,
        ]);

        return [$tenant, $user];
    }

    /**
     * @param  array<string, mixed>  $userAttributes
     */
    protected function createUserInTenant(Tenant $tenant, array $userAttributes = []): User
    {
        $this->tenants()->use($tenant);

        $user = User::factory()->create($userAttributes);

        TenantUserIndex::query()->create([
            'email' => $user->email,
            'tenant_id' => $tenant->id,
        ]);

        return $user;
    }

    protected function actingAsTenant(User $user, Tenant $tenant): static
    {
        $this->tenants()->use($tenant);

        return $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->withSession([
                TenantManager::SESSION_KEY => $tenant->id,
            ])
            ->actingAs($user);
    }

    protected function tenants(): TenantManager
    {
        return $this->app->make(TenantManager::class);
    }

    protected function cleanTenantSqliteFiles(): void
    {
        $directory = storage_path('framework/testing/tenants');

        if (File::isDirectory($directory)) {
            File::cleanDirectory($directory);
        }
    }
}

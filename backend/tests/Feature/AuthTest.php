<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Support\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_receive_their_profile(): void
    {
        [$tenant, $user] = $this->provisionTenantWithUser(
            ['name' => 'Acme', 'slug' => 'acme'],
            ['email' => 'alice@acme.test', 'password' => 'password'],
        );

        $response = $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/login', [
                'email' => 'alice@acme.test',
                'password' => 'password',
            ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'alice@acme.test')
            ->assertJsonPath('user.tenant.slug', 'acme')
            ->assertJsonPath('user.tenant_id', $tenant->id);

        $this->assertAuthenticatedAs($user);
        $this->assertSame($tenant->id, session(TenantManager::SESSION_KEY));
    }

    public function test_login_then_api_requests_hit_tenant_database(): void
    {
        [$tenant, $user] = $this->provisionTenantWithUser(
            ['slug' => 'acme'],
            ['email' => 'alice@acme.test', 'password' => 'password'],
        );

        $this->tenants()->use($tenant);
        Task::factory()->create(['title' => 'Tenant board task']);

        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/login', [
                'email' => 'alice@acme.test',
                'password' => 'password',
            ])
            ->assertOk();

        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Tenant board task');

        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', 'alice@acme.test')
            ->assertJsonPath('tenant.slug', 'acme');
    }

    public function test_user_lookup_is_safe_when_tenant_connection_is_inactive(): void
    {
        [$tenant, $user] = $this->provisionTenantWithUser();

        // Session save / Auth::id() must not query the central DB placeholder.
        $this->tenants()->forget();

        $provider = $this->app['auth']->createUserProvider('users');

        $this->assertNull($provider->retrieveById($user->id));
        $this->assertNull($provider->retrieveByToken($user->id, 'fake-remember-token'));
    }

    public function test_authenticated_request_without_tenant_session_is_unauthorized(): void
    {
        [$tenant, $user] = $this->provisionTenantWithUser(
            ['slug' => 'acme'],
            ['email' => 'alice@acme.test', 'password' => 'password'],
        );

        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/login', [
                'email' => 'alice@acme.test',
                'password' => 'password',
            ])
            ->assertOk();

        // Drop tenant context while leaving the request stateful — must 401, not 500.
        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->withSession([TenantManager::SESSION_KEY => ''])
            ->getJson('/api/user')
            ->assertUnauthorized();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->provisionTenantWithUser(
            ['slug' => 'acme'],
            ['email' => 'alice@acme.test', 'password' => 'password'],
        );

        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/login', [
                'email' => 'alice@acme.test',
                'password' => 'wrong',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_rejects_unknown_email(): void
    {
        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/login', [
                'email' => 'nobody@example.test',
                'password' => 'password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_requires_email_and_password(): void
    {
        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/login', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_requires_valid_email_format(): void
    {
        $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/login', [
                'email' => 'not-an-email',
                'password' => 'password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        [$tenant, $user] = $this->provisionTenantWithUser(
            ['slug' => 'acme'],
            ['email' => 'alice@acme.test'],
        );

        $this->actingAsTenant($user, $tenant)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', 'alice@acme.test')
            ->assertJsonPath('tenant.slug', 'acme');
    }

    public function test_guest_cannot_fetch_profile(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_user_can_logout(): void
    {
        [$tenant, $user] = $this->provisionTenantWithUser();

        $this
            ->actingAsTenant($user, $tenant)
            ->withHeader('Origin', 'http://localhost:5173')
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out');
    }

    public function test_guest_cannot_logout(): void
    {
        $this->postJson('/api/logout')->assertUnauthorized();
    }
}

<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_only_sees_tasks_for_their_tenant_database(): void
    {
        [$acme, $acmeUser] = $this->provisionTenantWithUser(['slug' => 'acme']);
        Task::factory()->create([
            'title' => 'Acme task',
            'assignee_id' => $acmeUser->id,
        ]);

        [$globex, $globexUser] = $this->provisionTenantWithUser(['slug' => 'globex']);
        $this->tenants()->use($globex);
        Task::factory()->create([
            'title' => 'Globex task',
            'assignee_id' => $globexUser->id,
        ]);

        $this->actingAsTenant($acmeUser, $acme)
            ->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Acme task');
    }

    public function test_user_cannot_view_another_tenants_task_by_id(): void
    {
        [$acmeUser, $acme, $globexTask] = $this->seedForeignTaskOnly();

        $this->actingAsTenant($acmeUser, $acme)
            ->getJson('/api/tasks/'.$globexTask->id)
            ->assertNotFound();
    }

    public function test_user_cannot_update_another_tenants_task(): void
    {
        [$acmeUser, $acme, $globexTask, $globex] = $this->seedForeignTaskOnly();

        $this->actingAsTenant($acmeUser, $acme)
            ->putJson('/api/tasks/'.$globexTask->id, [
                'title' => 'Hijacked',
            ])
            ->assertNotFound();

        $this->tenants()->use($globex);
        $this->assertDatabaseHas('tasks', [
            'id' => $globexTask->id,
            'title' => 'Globex task',
        ], TenantManager::CONNECTION);
    }

    public function test_user_cannot_delete_another_tenants_task(): void
    {
        [$acmeUser, $acme, $globexTask, $globex] = $this->seedForeignTaskOnly();

        $this->actingAsTenant($acmeUser, $acme)
            ->deleteJson('/api/tasks/'.$globexTask->id)
            ->assertNotFound();

        $this->tenants()->use($globex);
        $this->assertDatabaseHas('tasks', [
            'id' => $globexTask->id,
        ], TenantManager::CONNECTION);
    }

    public function test_user_cannot_assign_user_from_another_tenant_database(): void
    {
        [$acme, $acmeUser] = $this->provisionTenantWithUser(['slug' => 'acme']);
        [$globex] = $this->provisionTenantWithUser(['slug' => 'globex']);

        $this->tenants()->use($globex);
        $this->createUserInTenant($globex);
        $this->createUserInTenant($globex);
        $this->createUserInTenant($globex);
        $foreign = $this->createUserInTenant($globex);
        $foreignId = $foreign->id;

        $this->actingAsTenant($acmeUser, $acme)
            ->postJson('/api/tasks', [
                'title' => 'Should fail',
                'assignee_id' => $foreignId,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['assignee_id']);
    }

    public function test_status_filter_does_not_leak_other_tenant_tasks(): void
    {
        [$acme, $acmeUser] = $this->provisionTenantWithUser();
        Task::factory()->create([
            'title' => 'Acme done',
            'status' => TaskStatus::Done,
        ]);

        [$globex] = $this->provisionTenantWithUser();
        $this->tenants()->use($globex);
        Task::factory()->create([
            'title' => 'Globex done',
            'status' => TaskStatus::Done,
        ]);

        $this->actingAsTenant($acmeUser, $acme)
            ->getJson('/api/tasks?status=done')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Acme done')
            ->assertJsonMissing(['title' => 'Globex done']);
    }

    public function test_user_can_create_and_update_task_within_tenant(): void
    {
        [$tenant, $user] = $this->provisionTenantWithUser();
        $teammate = $this->createUserInTenant($tenant);

        $create = $this->actingAsTenant($user, $tenant)->postJson('/api/tasks', [
            'title' => 'Ship feature',
            'description' => 'Build isolation',
            'status' => TaskStatus::Todo->value,
            'assignee_id' => $teammate->id,
        ]);

        $create->assertCreated()
            ->assertJsonPath('data.title', 'Ship feature')
            ->assertJsonPath('data.assignee.id', $teammate->id);

        $taskId = $create->json('data.id');

        $this->actingAsTenant($user, $tenant)
            ->putJson('/api/tasks/'.$taskId, [
                'status' => TaskStatus::Done->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'done');
    }

    public function test_tenant_users_endpoint_only_lists_same_tenant_database(): void
    {
        [$acme, $acmeUser] = $this->provisionTenantWithUser([], ['name' => 'Alice']);
        $this->createUserInTenant($acme, ['name' => 'Bob']);

        [$globex] = $this->provisionTenantWithUser([], ['name' => 'Carol']);
        $this->tenants()->use($globex);

        $this->actingAsTenant($acmeUser, $acme)
            ->getJson('/api/users')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonMissing(['name' => 'Carol']);
    }

    /**
     * Acme has a user but no tasks, so Globex task IDs cannot collide in Acme's DB.
     *
     * @return array{0: User, 1: Tenant, 2: Task, 3: Tenant}
     */
    private function seedForeignTaskOnly(): array
    {
        [$acme, $acmeUser] = $this->provisionTenantWithUser(['slug' => 'acme']);

        [$globex, $globexUser] = $this->provisionTenantWithUser(['slug' => 'globex']);
        $this->tenants()->use($globex);
        $globexTask = Task::factory()->create([
            'title' => 'Globex task',
            'assignee_id' => $globexUser->id,
        ]);

        return [$acmeUser, $acme, $globexTask, $globex];
    }
}

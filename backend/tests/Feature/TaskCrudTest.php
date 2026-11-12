<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_task_endpoints(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
        $this->postJson('/api/tasks', ['title' => 'Nope'])->assertUnauthorized();
        $this->getJson('/api/tasks/1')->assertUnauthorized();
        $this->putJson('/api/tasks/1', ['title' => 'Nope'])->assertUnauthorized();
        $this->deleteJson('/api/tasks/1')->assertUnauthorized();
        $this->getJson('/api/users')->assertUnauthorized();
    }

    public function test_user_can_list_tasks_filtered_by_status(): void
    {
        [$tenant, $user] = $this->makeTenantUser();

        Task::factory()->create([
            'title' => 'Todo item',
            'status' => TaskStatus::Todo,
        ]);
        Task::factory()->create([
            'title' => 'Done item',
            'status' => TaskStatus::Done,
        ]);

        $this->actingAsTenant($user, $tenant)
            ->getJson('/api/tasks?status=done')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Done item');
    }

    public function test_user_can_show_own_task(): void
    {
        [$tenant, $user] = $this->makeTenantUser();
        $task = Task::factory()->create([
            'title' => 'Visible task',
            'assignee_id' => $user->id,
        ]);

        $this->actingAsTenant($user, $tenant)
            ->getJson('/api/tasks/'.$task->id)
            ->assertOk()
            ->assertJsonPath('data.title', 'Visible task')
            ->assertJsonPath('data.assignee.id', $user->id);
    }

    public function test_create_requires_title(): void
    {
        [$tenant, $user] = $this->makeTenantUser();

        $this->actingAsTenant($user, $tenant)
            ->postJson('/api/tasks', [
                'description' => 'Missing title',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }

    public function test_create_rejects_invalid_status(): void
    {
        [$tenant, $user] = $this->makeTenantUser();

        $this->actingAsTenant($user, $tenant)
            ->postJson('/api/tasks', [
                'title' => 'Bad status',
                'status' => 'blocked',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_create_rejects_unknown_assignee_id(): void
    {
        [$tenant, $user] = $this->makeTenantUser();

        $this->actingAsTenant($user, $tenant)
            ->postJson('/api/tasks', [
                'title' => 'Ghost assignee',
                'assignee_id' => 999999,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['assignee_id']);
    }

    public function test_user_can_create_task_without_assignee(): void
    {
        [$tenant, $user] = $this->makeTenantUser();

        $this->actingAsTenant($user, $tenant)
            ->postJson('/api/tasks', [
                'title' => 'Unassigned work',
                'description' => null,
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Unassigned work')
            ->assertJsonPath('data.status', 'todo')
            ->assertJsonPath('data.assignee_id', null);
    }

    public function test_user_can_update_all_fields_and_clear_assignee(): void
    {
        [$tenant, $user, $teammate] = $this->makeTenantUser(withTeammate: true);
        $task = Task::factory()->create([
            'title' => 'Old title',
            'assignee_id' => $teammate->id,
            'status' => TaskStatus::Todo,
        ]);

        $this->actingAsTenant($user, $tenant)
            ->putJson('/api/tasks/'.$task->id, [
                'title' => 'New title',
                'description' => 'Updated details',
                'status' => TaskStatus::InProgress->value,
                'assignee_id' => null,
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'New title')
            ->assertJsonPath('data.description', 'Updated details')
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.assignee_id', null);
    }

    public function test_update_rejects_assignee_missing_from_tenant_database(): void
    {
        [$tenant, $user] = $this->makeTenantUser();
        [$otherTenant] = $this->provisionTenantWithUser(['slug' => 'other-org']);

        $this->tenants()->use($otherTenant);
        User::factory()->count(5)->create();
        $outsider = User::factory()->create();
        $foreignId = $outsider->id;

        $this->tenants()->use($tenant);
        $task = Task::factory()->create();

        $this->actingAsTenant($user, $tenant)
            ->putJson('/api/tasks/'.$task->id, [
                'assignee_id' => $foreignId,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['assignee_id']);
    }

    public function test_update_rejects_invalid_status(): void
    {
        [$tenant, $user] = $this->makeTenantUser();
        $task = Task::factory()->create();

        $this->actingAsTenant($user, $tenant)
            ->putJson('/api/tasks/'.$task->id, [
                'status' => 'nope',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_user_can_delete_own_task(): void
    {
        [$tenant, $user] = $this->makeTenantUser();
        $task = Task::factory()->create([
            'title' => 'Delete me',
        ]);

        $this->actingAsTenant($user, $tenant)
            ->deleteJson('/api/tasks/'.$task->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id], TenantManager::CONNECTION);
    }

    public function test_created_task_lives_in_tenant_database(): void
    {
        [$tenant, $user] = $this->makeTenantUser();

        $response = $this->actingAsTenant($user, $tenant)->postJson('/api/tasks', [
            'title' => 'Scoped create',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('tasks', [
            'id' => $response->json('data.id'),
            'title' => 'Scoped create',
        ], TenantManager::CONNECTION);
    }

    /**
     * @return array{0: Tenant, 1: User, 2?: User}
     */
    private function makeTenantUser(bool $withTeammate = false): array
    {
        [$tenant, $user] = $this->provisionTenantWithUser();

        if (! $withTeammate) {
            return [$tenant, $user];
        }

        $teammate = $this->createUserInTenant($tenant);

        return [$tenant, $user, $teammate];
    }
}

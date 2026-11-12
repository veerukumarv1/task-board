<?php

namespace Database\Seeders;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\TenantUserIndex;
use App\Models\User;
use App\Support\TenantManager;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /** @var TenantManager $tenants */
        $tenants = app(TenantManager::class);

        $acme = Tenant::query()->create([
            'name' => 'Acme Corp',
            'slug' => 'acme',
            'database' => TenantManager::databaseNameForSlug('acme'),
        ]);

        $globex = Tenant::query()->create([
            'name' => 'Globex Industries',
            'slug' => 'globex',
            'database' => TenantManager::databaseNameForSlug('globex'),
        ]);

        $tenants->dropDatabase($acme);
        $tenants->provision($acme);
        $tenants->use($acme);

        $alice = User::query()->create([
            'name' => 'Alice Nguyen',
            'email' => 'alice@acme.test',
            'password' => Hash::make('password'),
        ]);

        $bob = User::query()->create([
            'name' => 'Bob Martinez',
            'email' => 'bob@acme.test',
            'password' => Hash::make('password'),
        ]);

        $this->indexUser($acme, $alice->email);
        $this->indexUser($acme, $bob->email);

        $this->seedTasks([
            [
                'assignee_id' => $alice->id,
                'title' => 'Finalize Q2 product roadmap',
                'description' => 'Align engineering, sales, and customer success on the top 5 initiatives for the next quarter. Include effort estimates and target release windows.',
                'status' => TaskStatus::InProgress,
            ],
            [
                'assignee_id' => $bob->id,
                'title' => 'Fix checkout timeout on slow networks',
                'description' => 'Customers on mobile data are seeing payment confirmation hang after 15s. Reproduce with throttling, add retry UI, and raise the API timeout safely.',
                'status' => TaskStatus::Todo,
            ],
            [
                'assignee_id' => $alice->id,
                'title' => 'Write release notes for v2.8',
                'description' => 'Cover SSO improvements, invoice PDF export, and the new notification preferences. Keep it customer-facing and under 400 words.',
                'status' => TaskStatus::Todo,
            ],
            [
                'assignee_id' => $bob->id,
                'title' => 'Add audit log export for enterprise accounts',
                'description' => 'Support CSV download of the last 90 days of admin actions. Filter by actor, action type, and date range.',
                'status' => TaskStatus::InProgress,
            ],
            [
                'assignee_id' => $alice->id,
                'title' => 'Migrate staging database to MySQL 8.4',
                'description' => 'Validate backups, run the upgrade on staging, smoke-test Sanctum auth and tenant scoping, then document the production cutover checklist.',
                'status' => TaskStatus::Done,
            ],
            [
                'assignee_id' => null,
                'title' => 'Design empty state for the analytics dashboard',
                'description' => 'When a workspace has no events yet, show a helpful empty state with setup steps instead of a blank chart grid.',
                'status' => TaskStatus::Todo,
            ],
            [
                'assignee_id' => $bob->id,
                'title' => 'Rotate expired API credentials for Partner Hub',
                'description' => 'Three partner integrations are using keys that expire this Friday. Issue replacements, update secrets, and confirm webhook delivery.',
                'status' => TaskStatus::Done,
            ],
        ]);

        $tenants->dropDatabase($globex);
        $tenants->provision($globex);
        $tenants->use($globex);

        $carol = User::query()->create([
            'name' => 'Carol Okonkwo',
            'email' => 'carol@globex.test',
            'password' => Hash::make('password'),
        ]);

        $dan = User::query()->create([
            'name' => 'Dan Patel',
            'email' => 'dan@globex.test',
            'password' => Hash::make('password'),
        ]);

        $this->indexUser($globex, $carol->email);
        $this->indexUser($globex, $dan->email);

        $this->seedTasks([
            [
                'assignee_id' => $carol->id,
                'title' => 'Schedule preventive maintenance for Line B',
                'description' => 'Coordinate with operations for a 6-hour window this weekend. Replace worn conveyor rollers and recalibrate the vision sensors.',
                'status' => TaskStatus::InProgress,
            ],
            [
                'assignee_id' => $dan->id,
                'title' => 'Update supplier scorecards for March',
                'description' => 'Pull on-time delivery, defect rate, and lead-time data from the ERP. Flag any supplier below 92% OTIF for the weekly ops review.',
                'status' => TaskStatus::Todo,
            ],
            [
                'assignee_id' => $carol->id,
                'title' => 'Approve safety checklist for new press operators',
                'description' => 'Review the revised LOTO and PPE checklist from EHS. Confirm translations are complete before Monday’s training cohort.',
                'status' => TaskStatus::Todo,
            ],
            [
                'assignee_id' => $dan->id,
                'title' => 'Investigate spike in scrap rate on SKU-4412',
                'description' => 'Scrap jumped from 1.2% to 3.8% over the last 5 shifts. Compare material lots, machine settings, and temperature logs.',
                'status' => TaskStatus::InProgress,
            ],
            [
                'assignee_id' => $carol->id,
                'title' => 'Ship onboarding kit to Cincinnati plant',
                'description' => 'Include badge printers, scanner cradles, and the updated floor map posters. Confirm receiving by Friday.',
                'status' => TaskStatus::Done,
            ],
            [
                'assignee_id' => null,
                'title' => 'Negotiate Q3 freight rates with regional carrier',
                'description' => 'Current contract ends June 30. Target a 4–6% reduction with volume commitments across Midwest routes.',
                'status' => TaskStatus::Todo,
            ],
            [
                'assignee_id' => $dan->id,
                'title' => 'Close CAPA for temperature excursion in Warehouse 2',
                'description' => 'Document root cause, corrective actions, and verification results. Attach sensor calibration certificates before QA sign-off.',
                'status' => TaskStatus::Done,
            ],
        ]);

        $tenants->forget();
    }

    private function indexUser(Tenant $tenant, string $email): void
    {
        TenantUserIndex::query()->create([
            'email' => $email,
            'tenant_id' => $tenant->id,
        ]);
    }

    /**
     * @param  list<array{assignee_id: int|null, title: string, description: string, status: TaskStatus}>  $tasks
     */
    private function seedTasks(array $tasks): void
    {
        foreach ($tasks as $task) {
            Task::query()->create($task);
        }
    }
}

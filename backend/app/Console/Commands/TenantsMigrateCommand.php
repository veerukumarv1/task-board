<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\TenantManager;
use Illuminate\Console\Command;

class TenantsMigrateCommand extends Command
{
    protected $signature = 'tenants:migrate';

    protected $description = 'Run tenant migrations against every registered tenant database';

    public function handle(TenantManager $tenants): int
    {
        $count = 0;

        Tenant::query()->orderBy('id')->each(function (Tenant $tenant) use ($tenants, &$count): void {
            $this->info("Migrating {$tenant->slug} ({$tenant->database})...");
            $tenants->provision($tenant);
            $count++;
        });

        $this->info("Migrated {$count} tenant database(s).");

        return self::SUCCESS;
    }
}

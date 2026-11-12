<?php

namespace App\Support;

use App\Models\Tenant;
use Illuminate\Http\Request;

final class TenancyBootstrap
{
    public static function fromRequest(Request $request, TenantManager $tenants): void
    {
        if (! $request->hasSession()) {
            return;
        }

        $tenantId = $request->session()->get(TenantManager::SESSION_KEY);

        if ($tenantId && ($tenant = Tenant::query()->find($tenantId))) {
            $tenants->use($tenant);

            return;
        }

        $tenants->forget();
    }
}

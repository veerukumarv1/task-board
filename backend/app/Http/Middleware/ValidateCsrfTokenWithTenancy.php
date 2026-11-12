<?php

namespace App\Http\Middleware;

use App\Support\TenancyBootstrap;
use App\Support\TenantManager;
use Closure;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CSRF runs before AuthenticateSession in Sanctum's stack. If the token is
 * invalid, session save still calls Auth::id() — which queries the tenant
 * User model. Bootstrap tenancy first so that lookup hits the right DB
 * (or safely no-ops via the tenant-aware user provider).
 */
class ValidateCsrfTokenWithTenancy
{
    public function __construct(
        private TenantManager $tenants,
        private ValidateCsrfToken $csrf,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        TenancyBootstrap::fromRequest($request, $this->tenants);

        return $this->csrf->handle($request, $next);
    }
}

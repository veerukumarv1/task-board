<?php

namespace App\Http\Middleware;

use App\Support\TenancyBootstrap;
use App\Support\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sanctum's AuthenticateSession calls $request->user() before route middleware runs.
 * Switch the tenant DB connection first so User lookups hit the org database.
 */
class AuthenticateSessionWithTenancy
{
    public function __construct(
        private TenantManager $tenants,
        private AuthenticateSession $authenticateSession,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        TenancyBootstrap::fromRequest($request, $this->tenants);

        if ($this->tenants->current()) {
            return $this->authenticateSession->handle($request, $next);
        }

        // Remember-me / leftover session auth without a tenant would query the
        // central DB via the tenant connection. Drop that stale auth quietly.
        $this->forgetStaleAuth($request);

        return $next($request);
    }

    private function forgetStaleAuth(Request $request): void
    {
        $guard = Auth::guard('web');

        if (method_exists($guard, 'forgetUser')) {
            $guard->forgetUser();
        }

        if (method_exists($guard, 'getRecallerName')) {
            Cookie::queue(Cookie::forget($guard->getRecallerName()));
        }

        foreach (array_keys($request->session()->all()) as $key) {
            if (str_starts_with($key, 'login_') || str_starts_with($key, 'password_hash_')) {
                $request->session()->forget($key);
            }
        }
    }
}

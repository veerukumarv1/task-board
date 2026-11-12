<?php

namespace App\Http\Middleware;

use App\Support\TenancyBootstrap;
use App\Support\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancy
{
    public function __construct(private TenantManager $tenants) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        TenancyBootstrap::fromRequest($request, $this->tenants);

        return $next($request);
    }
}

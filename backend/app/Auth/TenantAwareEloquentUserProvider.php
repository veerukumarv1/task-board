<?php

namespace App\Auth;

use App\Support\TenantManager;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Avoid querying the uninitialized tenant connection (central DB placeholder)
 * during session save / recaller hydration when no tenant is active.
 */
class TenantAwareEloquentUserProvider extends EloquentUserProvider
{
    public function retrieveById($identifier): ?Authenticatable
    {
        if (! app(TenantManager::class)->current()) {
            return null;
        }

        return parent::retrieveById($identifier);
    }

    public function retrieveByToken($identifier, #[\SensitiveParameter] $token): ?Authenticatable
    {
        if (! app(TenantManager::class)->current()) {
            return null;
        }

        return parent::retrieveByToken($identifier, $token);
    }
}

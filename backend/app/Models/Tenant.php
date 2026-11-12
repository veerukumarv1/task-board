<?php

namespace App\Models;

use App\Support\TenantManager;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'database'])]
class Tenant extends Model
{
    use HasFactory;

    public function userIndex(): HasMany
    {
        return $this->hasMany(TenantUserIndex::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant): void {
            if (! $tenant->database) {
                $tenant->database = TenantManager::databaseNameForSlug((string) $tenant->slug);
            }
        });
    }
}

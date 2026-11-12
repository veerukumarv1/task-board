<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['email', 'tenant_id'])]
class TenantUserIndex extends Model
{
    protected $table = 'tenant_user_index';

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}

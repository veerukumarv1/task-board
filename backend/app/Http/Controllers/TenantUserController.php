<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TenantUserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $users = User::query()
            ->orderBy('name')
            ->get();

        return UserResource::collection($users);
    }
}

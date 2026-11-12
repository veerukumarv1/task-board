<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\TenantUserIndex;
use App\Support\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private TenantManager $tenants) {}

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $index = TenantUserIndex::query()
            ->with('tenant')
            ->where('email', $credentials['email'])
            ->first();

        if (! $index?->tenant) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $this->tenants->use($index->tenant);

        // Remember-me cookies cannot carry tenant context; session + tenant_id only.
        if (! Auth::attempt($credentials, remember: false)) {
            $this->tenants->forget();

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($request->hasSession()) {
            $request->session()->put(TenantManager::SESSION_KEY, $index->tenant->id);
            $request->session()->regenerate();
        }

        return response()->json([
            'user' => (new UserResource($request->user()))->resolve(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $this->tenants->forget();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(
            (new UserResource($request->user()))->resolve(),
        );
    }
}

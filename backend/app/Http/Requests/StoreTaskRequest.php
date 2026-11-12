<?php

namespace App\Http\Requests;

use App\Enums\TaskStatus;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(TaskStatus::class)],
            'assignee_id' => [
                'nullable',
                'integer',
                Rule::exists(User::class, 'id'),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $assigneeId = $this->input('assignee_id');

            if ($assigneeId === null) {
                return;
            }

            if (! User::query()->whereKey($assigneeId)->exists()) {
                $validator->errors()->add(
                    'assignee_id',
                    'Assignee must belong to your organization.',
                );
            }
        });
    }
}

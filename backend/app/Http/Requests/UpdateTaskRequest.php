<?php

namespace App\Http\Requests;

use App\Enums\TaskStatus;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTaskRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', Rule::enum(TaskStatus::class)],
            'assignee_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists(User::class, 'id'),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->exists('assignee_id') || $this->input('assignee_id') === null) {
                return;
            }

            if (! User::query()->whereKey($this->input('assignee_id'))->exists()) {
                $validator->errors()->add(
                    'assignee_id',
                    'Assignee must belong to your organization.',
                );
            }
        });
    }
}

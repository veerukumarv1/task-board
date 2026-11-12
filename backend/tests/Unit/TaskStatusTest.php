<?php

namespace Tests\Unit;

use App\Enums\TaskStatus;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class TaskStatusTest extends TestCase
{
    public function test_values_list_is_stable(): void
    {
        $this->assertSame(['todo', 'in_progress', 'done'], TaskStatus::values());
    }

    public function test_enum_cases_match_string_values(): void
    {
        $this->assertSame('todo', TaskStatus::Todo->value);
        $this->assertSame('in_progress', TaskStatus::InProgress->value);
        $this->assertSame('done', TaskStatus::Done->value);
    }

    #[DataProvider('allowedTransitions')]
    public function test_allowed_transitions(TaskStatus $from, TaskStatus $to): void
    {
        $this->assertTrue($from->canTransitionTo($to));
    }

    #[DataProvider('disallowedTransitions')]
    public function test_disallowed_transitions(TaskStatus $from, TaskStatus $to): void
    {
        $this->assertFalse($from->canTransitionTo($to));
    }

    /**
     * @return list<array{0: TaskStatus, 1: TaskStatus}>
     */
    public static function allowedTransitions(): array
    {
        return [
            [TaskStatus::Todo, TaskStatus::InProgress],
            [TaskStatus::Todo, TaskStatus::Done],
            [TaskStatus::InProgress, TaskStatus::Todo],
            [TaskStatus::InProgress, TaskStatus::Done],
            [TaskStatus::Done, TaskStatus::InProgress],
            [TaskStatus::Done, TaskStatus::Todo],
        ];
    }

    /**
     * @return list<array{0: TaskStatus, 1: TaskStatus}>
     */
    public static function disallowedTransitions(): array
    {
        return [
            [TaskStatus::Todo, TaskStatus::Todo],
            [TaskStatus::InProgress, TaskStatus::InProgress],
            [TaskStatus::Done, TaskStatus::Done],
        ];
    }
}

<?php

namespace App\Enums;

enum TaskStatus: string
{
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case Done = 'done';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Todo => in_array($next, [self::InProgress, self::Done], true),
            self::InProgress => in_array($next, [self::Todo, self::Done], true),
            self::Done => in_array($next, [self::InProgress, self::Todo], true),
        };
    }
}

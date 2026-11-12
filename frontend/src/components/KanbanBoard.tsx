import {
  useMemo,
  useState,
  type DragEvent,
} from 'react'
import { IconButton } from './IconButton'
import { DeleteIcon, EditIcon, ViewIcon } from './icons'
import type { Task, TaskStatus } from '../types'

const COLUMNS: Array<{ id: TaskStatus; title: string; hint: string }> = [
  { id: 'todo', title: 'To do', hint: 'Ready to start' },
  { id: 'in_progress', title: 'In progress', hint: 'Actively moving' },
  { id: 'done', title: 'Done', hint: 'Completed work' },
]

interface KanbanBoardProps {
  tasks: Task[]
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>
  onView: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function KanbanBoard({
  tasks,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)
  const [movingId, setMovingId] = useState<number | null>(null)

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    }

    for (const task of tasks) {
      map[task.status].push(task)
    }

    return map
  }, [tasks])

  function onDragStart(event: DragEvent<HTMLElement>, task: Task) {
    event.dataTransfer.setData('text/task-id', String(task.id))
    event.dataTransfer.effectAllowed = 'move'
    setDraggingId(task.id)
  }

  function onDragEnd() {
    setDraggingId(null)
    setOverColumn(null)
  }

  function onDragOverColumn(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setOverColumn(status)
  }

  async function onDropColumn(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault()
    const rawId = event.dataTransfer.getData('text/task-id')
    const taskId = Number(rawId)
    const task = tasks.find((item) => item.id === taskId)

    setOverColumn(null)
    setDraggingId(null)

    if (!task || task.status === status) {
      return
    }

    setMovingId(task.id)
    try {
      await onStatusChange(task, status)
    } finally {
      setMovingId(null)
    }
  }

  return (
    <div className="kanban" aria-label="Task board">
      {COLUMNS.map((column) => (
        <section
          key={column.id}
          className={`kanban-column${overColumn === column.id ? ' is-over' : ''}`}
          onDragOver={(event) => onDragOverColumn(event, column.id)}
          onDragLeave={() => setOverColumn((current) => (current === column.id ? null : current))}
          onDrop={(event) => void onDropColumn(event, column.id)}
          data-status={column.id}
        >
          <header className="kanban-column__header">
            <div>
              <h2>{column.title}</h2>
              <p>{column.hint}</p>
            </div>
            <span className="kanban-column__count">{grouped[column.id].length}</span>
          </header>

          <div className="kanban-column__body">
            {grouped[column.id].length === 0 ? (
              <div className="kanban-empty">Drop tasks here</div>
            ) : (
              grouped[column.id].map((task) => (
                <article
                  key={task.id}
                  className={[
                    'kanban-card',
                    draggingId === task.id ? 'is-dragging' : '',
                    movingId === task.id ? 'is-moving' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  draggable
                  onDragStart={(event) => onDragStart(event, task)}
                  onDragEnd={onDragEnd}
                  data-task-id={task.id}
                >
                  <div className="kanban-card__content">
                    <h3>{task.title}</h3>
                    {task.description ? <p>{task.description}</p> : null}
                    <div className="kanban-card__meta">
                      <span className="kanban-card__assignee">
                        {task.assignee?.name ?? 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="kanban-card__actions">
                    <IconButton
                      label="View task"
                      onClick={(event) => {
                        event.stopPropagation()
                        onView(task)
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      label="Edit task"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(task)
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      label="Delete task"
                      tone="danger"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDelete(task)
                      }}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

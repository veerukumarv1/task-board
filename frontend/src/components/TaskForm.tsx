import { useEffect, useState, type FormEvent } from 'react'
import { IconButton } from './IconButton'
import { CloseIcon } from './icons'
import { SelectField } from './SelectField'
import type { Task, TaskPayload, TaskStatus, User } from '../types'

interface TaskFormProps {
  title: string
  initial?: Task | null
  users: User[]
  submitting: boolean
  readOnly?: boolean
  onSubmit: (payload: TaskPayload) => Promise<void>
  onClose: () => void
  onEdit?: () => void
}

const statuses: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

export function TaskForm({
  title,
  initial,
  users,
  submitting,
  readOnly = false,
  onSubmit,
  onClose,
  onEdit,
}: TaskFormProps) {
  const [taskTitle, setTaskTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'todo')
  const [assigneeId, setAssigneeId] = useState<string>(
    initial?.assignee_id ? String(initial.assignee_id) : '',
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (readOnly) {
      return
    }

    setError(null)

    try {
      await onSubmit({
        title: taskTitle.trim(),
        description: description.trim() || null,
        status,
        assignee_id: assigneeId ? Number(assigneeId) : null,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not save the task.'
      setError(message)
    }
  }

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map((user) => ({
      value: String(user.id),
      label: user.name,
    })),
  ]

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="task-form-title">{title}</h2>
          <IconButton label="Close" className="modal__close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              required
              maxLength={255}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          <div className="field">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          <SelectField
            id="task-status"
            label="Status"
            value={status}
            disabled={readOnly}
            options={statuses.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            onChange={(next) => setStatus(next as TaskStatus)}
          />

          <SelectField
            id="task-assignee"
            label="Assignee"
            value={assigneeId}
            disabled={readOnly}
            options={assigneeOptions}
            onChange={setAssigneeId}
          />

          {readOnly ? (
            <button className="btn btn--primary btn--full" type="button" onClick={onEdit}>
              Edit task
            </button>
          ) : (
            <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save task'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

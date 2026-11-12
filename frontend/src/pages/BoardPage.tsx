import { useCallback, useEffect, useState } from 'react'
import {
  createTask,
  deleteTask,
  fetchTasks,
  fetchTenantUsers,
  updateTask,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { KanbanBoard } from '../components/KanbanBoard'
import { TaskForm } from '../components/TaskForm'
import { ColorThemeMenu } from '../components/ColorThemeMenu'
import { ThemeToggle } from '../components/ThemeToggle'
import { UserMenu } from '../components/UserMenu'
import type { Task, TaskPayload, TaskStatus, User } from '../types'

type EditorMode = 'create' | 'edit' | 'view'

export function BoardPage() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadBoard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [taskResponse, userResponse] = await Promise.all([
        fetchTasks(),
        fetchTenantUsers(),
      ])
      setTasks(taskResponse.data)
      setUsers(userResponse.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  function closeEditor() {
    setEditorMode(null)
    setActiveTask(null)
  }

  async function handleSave(payload: TaskPayload) {
    setSaving(true)
    try {
      if (editorMode === 'edit' && activeTask) {
        await updateTask(activeTask.id, payload)
      } else {
        await createTask(payload)
      }
      closeEditor()
      await loadBoard()
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!taskPendingDelete) {
      return
    }

    setDeleting(true)
    try {
      await deleteTask(taskPendingDelete.id)
      setTasks((current) =>
        current.filter((item) => item.id !== taskPendingDelete.id),
      )
      setTaskPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    const previous = tasks
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status } : item)),
    )

    try {
      const response = await updateTask(task.id, { status })
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? response.data : item)),
      )
    } catch (err) {
      setTasks(previous)
      setError(err instanceof Error ? err.message : 'Failed to move task')
    }
  }

  const modalTitle =
    editorMode === 'view'
      ? 'View task'
      : editorMode === 'edit'
        ? 'Edit task'
        : 'New task'

  return (
    <div className="shell shell--board">
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark">Task Board</div>
          <div className="brand__meta">
            {user?.tenant?.name ?? 'Your organization'}
          </div>
        </div>

        <div className="topbar__actions">
          <ColorThemeMenu />
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} onLogout={() => void logout()} />
          ) : null}
        </div>
      </header>

      <div className="toolbar toolbar--end">
        <button
          className="btn btn--primary"
          type="button"
          data-testid="new-task"
          onClick={() => {
            setActiveTask(null)
            setEditorMode('create')
          }}
        >
          New task
        </button>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="panel empty-state">Loading board…</div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onView={(task) => {
            setActiveTask(task)
            setEditorMode('view')
          }}
          onEdit={(task) => {
            setActiveTask(task)
            setEditorMode('edit')
          }}
          onDelete={setTaskPendingDelete}
        />
      )}

      {editorMode ? (
        <TaskForm
          key={`${editorMode}-${activeTask?.id ?? 'new'}`}
          title={modalTitle}
          initial={activeTask}
          users={users}
          submitting={saving}
          readOnly={editorMode === 'view'}
          onSubmit={handleSave}
          onClose={closeEditor}
          onEdit={() => setEditorMode('edit')}
        />
      ) : null}

      {taskPendingDelete ? (
        <ConfirmDialog
          title="Delete task"
          message={`“${taskPendingDelete.title}” will be permanently removed from this board. This can’t be undone.`}
          confirmLabel={deleting ? 'Deleting…' : 'Delete task'}
          cancelLabel="Keep task"
          tone="danger"
          onConfirm={() => {
            if (!deleting) {
              void confirmDelete()
            }
          }}
          onCancel={() => {
            if (!deleting) {
              setTaskPendingDelete(null)
            }
          }}
        />
      ) : null}
    </div>
  )
}

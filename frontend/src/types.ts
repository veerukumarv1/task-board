export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Tenant {
  id: number
  name: string
  slug: string
}

export interface User {
  id: number
  name: string
  email: string
  tenant_id: number
  tenant?: Tenant
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  assignee_id: number | null
  assignee?: Pick<User, 'id' | 'name' | 'email'> | null
  created_at?: string
  updated_at?: string
}

export interface TaskPayload {
  title: string
  description?: string | null
  status?: TaskStatus
  assignee_id?: number | null
}

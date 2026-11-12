// Empty string = same-origin requests via the Vite proxy (required for Sanctum cookies).
const API_URL = import.meta.env.VITE_API_URL ?? ''

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
  })
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retryOnCsrf = true,
): Promise<T> {
  const headers = new Headers(options.headers ?? {})
  headers.set('Accept', 'application/json')
  headers.set('X-Requested-With', 'XMLHttpRequest')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const xsrf = readCookie('XSRF-TOKEN')
  if (xsrf) {
    headers.set('X-XSRF-TOKEN', xsrf)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (response.status === 419 && retryOnCsrf) {
    await ensureCsrfCookie()
    return api<T>(path, options, false)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(
      payload.message ?? `Request failed with status ${response.status}`,
    ) as Error & { status?: number; errors?: Record<string, string[]> }
    error.status = response.status
    error.errors = payload.errors
    throw error
  }

  return payload as T
}

export async function loginRequest(email: string, password: string) {
  await ensureCsrfCookie()
  return api<{ user: import('../types').User }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logoutRequest() {
  return api<{ message: string }>('/api/logout', { method: 'POST' })
}

export async function fetchCurrentUser() {
  return api<import('../types').User>('/api/user')
}

export async function fetchTasks(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return api<{ data: import('../types').Task[] }>(`/api/tasks${query}`)
}

export async function createTask(payload: import('../types').TaskPayload) {
  return api<{ data: import('../types').Task }>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTask(
  id: number,
  payload: Partial<import('../types').TaskPayload>,
) {
  return api<{ data: import('../types').Task }>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteTask(id: number) {
  return api<void>(`/api/tasks/${id}`, { method: 'DELETE' })
}

export async function fetchTenantUsers() {
  return api<{ data: import('../types').User[] }>('/api/users')
}

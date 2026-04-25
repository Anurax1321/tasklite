import { AuthUser, Category, CategoryInput, Task, TaskInput, TaskPatch } from './types';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:5291';

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const authApi = {
  signup: (email: string, password: string) =>
    req<AuthUser>('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    req<AuthUser>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => req<void>('/api/auth/logout', { method: 'POST' }),
  me: () => req<AuthUser>('/api/auth/me'),
};

export const tasksApi = {
  list: () => req<Task[]>('/api/tasks'),
  create: (input: TaskInput) =>
    req<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: TaskPatch) =>
    req<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => req<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
};

export const importApi = {
  ical: (payload: { url?: string; content?: string }) =>
    req<{ imported: number }>('/api/import/ical', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const categoriesApi = {
  list: () => req<Category[]>('/api/categories'),
  create: (input: CategoryInput) =>
    req<Category>('/api/categories', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, patch: Partial<CategoryInput>) =>
    req<Category>(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => req<void>(`/api/categories/${id}`, { method: 'DELETE' }),
};

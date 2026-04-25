export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  categoryId?: string;
  priority: Priority;
  dueDate?: string;
  position: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  categoryId?: string;
  priority: Priority;
  dueDate?: string;
}

export type TaskPatch = Partial<TaskInput & { completed: boolean; position: number }>;

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
}

import { Category, CategoryInput, Task, TaskInput, TaskPatch } from '../types';

export interface TaskStore {
  list(): Promise<Task[]>;
  create(input: TaskInput): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
}

export interface CategoryStore {
  list(): Promise<Category[]>;
  create(input: CategoryInput): Promise<Category>;
  update(id: string, patch: Partial<CategoryInput>): Promise<Category>;
  remove(id: string): Promise<void>;
}

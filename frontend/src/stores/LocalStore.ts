import { Category, Task } from '../types';
import { SEED_CATEGORIES_GUEST } from '../constants';
import { TaskStore, CategoryStore } from './types';

const TASKS_KEY = 'tasklite:guest-tasks';
const CATEGORIES_KEY = 'tasklite:guest-categories';

function readArr<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArr<T>(key: string, arr: T[]): void {
  localStorage.setItem(key, JSON.stringify(arr));
}

function uid(): string {
  return crypto.randomUUID();
}

function ensureCategoriesSeeded(): void {
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    const now = new Date().toISOString();
    const seeded: Category[] = SEED_CATEGORIES_GUEST.map(c => ({
      ...c,
      id: uid(),
      createdAt: now,
    }));
    writeArr(CATEGORIES_KEY, seeded);
  }
}

export const LocalTaskStore: TaskStore = {
  async list() {
    return readArr<Task>(TASKS_KEY);
  },
  async create(input) {
    const all = readArr<Task>(TASKS_KEY);
    const maxPos = all.reduce((m, t) => Math.max(m, t.position ?? 0), 0);
    const task: Task = {
      id: uid(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      completed: false,
      categoryId: input.categoryId,
      priority: input.priority,
      dueDate: input.dueDate,
      position: maxPos + 1,
      createdAt: new Date().toISOString(),
    };
    all.push(task);
    writeArr(TASKS_KEY, all);
    return task;
  },
  async update(id, patch) {
    const all = readArr<Task>(TASKS_KEY);
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('task not found');
    if (patch.title !== undefined) all[idx].title = patch.title.trim();
    if (patch.description !== undefined) all[idx].description = patch.description?.trim() || undefined;
    if (patch.completed !== undefined) all[idx].completed = patch.completed;
    if (patch.categoryId !== undefined) all[idx].categoryId = patch.categoryId || undefined;
    if (patch.priority !== undefined) all[idx].priority = patch.priority;
    if (patch.dueDate !== undefined) all[idx].dueDate = patch.dueDate || undefined;
    if (patch.position !== undefined && typeof patch.position === 'number') all[idx].position = patch.position;
    writeArr(TASKS_KEY, all);
    return all[idx];
  },
  async remove(id) {
    const all = readArr<Task>(TASKS_KEY);
    writeArr(TASKS_KEY, all.filter(t => t.id !== id));
  },
};

export const LocalCategoryStore: CategoryStore = {
  async list() {
    ensureCategoriesSeeded();
    return readArr<Category>(CATEGORIES_KEY);
  },
  async create(input) {
    ensureCategoriesSeeded();
    const cat: Category = {
      id: uid(),
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      createdAt: new Date().toISOString(),
    };
    const all = readArr<Category>(CATEGORIES_KEY);
    all.push(cat);
    writeArr(CATEGORIES_KEY, all);
    return cat;
  },
  async update(id, patch) {
    const all = readArr<Category>(CATEGORIES_KEY);
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('category not found');
    if (patch.name !== undefined) all[idx].name = patch.name.trim();
    if (patch.icon !== undefined) all[idx].icon = patch.icon;
    if (patch.color !== undefined) all[idx].color = patch.color;
    writeArr(CATEGORIES_KEY, all);
    return all[idx];
  },
  async remove(id) {
    const cats = readArr<Category>(CATEGORIES_KEY);
    writeArr(CATEGORIES_KEY, cats.filter(c => c.id !== id));
    const tasks = readArr<Task>(TASKS_KEY);
    let changed = false;
    for (const t of tasks) {
      if (t.categoryId === id) {
        t.categoryId = undefined;
        changed = true;
      }
    }
    if (changed) writeArr(TASKS_KEY, tasks);
  },
};

export function readGuestTasksRaw(): Task[] {
  return readArr<Task>(TASKS_KEY);
}
export function readGuestCategoriesRaw(): Category[] {
  return readArr<Category>(CATEGORIES_KEY);
}
export function clearGuestData(): void {
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
}

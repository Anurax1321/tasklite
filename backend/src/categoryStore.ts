import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { Category } from './types';

const DATA_FILE = path.join(__dirname, '..', 'data', 'categories.json');

export const DEFAULT_CATEGORY_SEED: Array<Pick<Category, 'name' | 'icon' | 'color'>> = [
  { name: 'Work', icon: '📝', color: '#2563eb' },
  { name: 'Personal', icon: '🏠', color: '#8b5cf6' },
  { name: 'Shopping', icon: '🛒', color: '#10b981' },
  { name: 'Health', icon: '💪', color: '#f97316' },
  { name: 'Study', icon: '📚', color: '#6366f1' },
  { name: 'Hobby', icon: '🎨', color: '#ec4899' },
  { name: 'Finance', icon: '💰', color: '#14b8a6' },
  { name: 'Other', icon: '🗂️', color: '#6b7280' },
];

export function readCategories(): Category[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export function writeCategories(cats: Category[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(cats, null, 2), 'utf-8');
}

export function seedCategoriesForUser(userId: string): Category[] {
  const now = new Date().toISOString();
  const seeded: Category[] = DEFAULT_CATEGORY_SEED.map(s => ({
    id: uuid(),
    userId,
    name: s.name,
    icon: s.icon,
    color: s.color,
    createdAt: now,
  }));
  const all = readCategories();
  writeCategories([...all, ...seeded]);
  return seeded;
}

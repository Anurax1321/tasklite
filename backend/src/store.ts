import fs from 'fs';
import path from 'path';
import { Task } from './types';

const DATA_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

export function readTasks(): Task[] {
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

export function writeTasks(tasks: Task[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

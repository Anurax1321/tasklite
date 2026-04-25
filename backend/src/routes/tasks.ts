import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { readTasks, writeTasks } from '../store';
import { readCategories } from '../categoryStore';
import { requireUser } from '../middleware/requireUser';
import { Priority, Task } from '../types';

const router = Router();

router.use(requireUser);

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high'];

function validateDueDate(v: unknown): string | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  if (typeof v !== 'string') return undefined;
  if (v.length === 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  return v;
}

function categoryBelongsToUser(categoryId: string, userId: string): boolean {
  return readCategories().some(c => c.id === categoryId && c.userId === userId);
}

router.get('/', (req: Request, res: Response) => {
  const all = readTasks();
  const mine = all.filter(t => t.userId === req.userId);
  let needsBackfill = false;
  let nextPos = mine.reduce((m, t) => Math.max(m, t.position ?? 0), 0);
  for (const t of mine) {
    if (typeof t.position !== 'number') {
      nextPos += 1;
      t.position = nextPos;
      needsBackfill = true;
    }
  }
  if (needsBackfill) writeTasks(all);
  res.json(mine);
});

router.post('/', (req: Request, res: Response) => {
  const { title, description, categoryId, priority, dueDate } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'title is required' });
  }

  let prio: Priority = 'medium';
  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'priority must be low|medium|high' });
    }
    prio = priority;
  }

  let due: string | undefined;
  if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
    const validated = validateDueDate(dueDate);
    if (validated === undefined) {
      return res.status(400).json({ error: 'dueDate must be YYYY-MM-DD' });
    }
    due = validated ?? undefined;
  }

  let catId: string | undefined;
  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    if (typeof categoryId !== 'string' || !categoryBelongsToUser(categoryId, req.userId!)) {
      return res.status(400).json({ error: 'invalid categoryId' });
    }
    catId = categoryId;
  }

  const tasks = readTasks();
  const userMaxPos = tasks
    .filter(t => t.userId === req.userId)
    .reduce((m, t) => Math.max(m, t.position ?? 0), 0);

  const task: Task = {
    id: uuid(),
    userId: req.userId!,
    title: title.trim(),
    description: typeof description === 'string' && description.trim() ? description.trim() : undefined,
    completed: false,
    categoryId: catId,
    priority: prio,
    dueDate: due,
    position: userMaxPos + 1,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  writeTasks(tasks);

  res.status(201).json(task);
});

router.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, completed, categoryId, priority, dueDate, position } = req.body ?? {};

  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === id && t.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'task not found' });

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title must be non-empty' });
    }
    tasks[idx].title = title.trim();
  }
  if (description !== undefined) {
    if (description === null || description === '') tasks[idx].description = undefined;
    else if (typeof description !== 'string') return res.status(400).json({ error: 'description must be string' });
    else tasks[idx].description = description.trim() || undefined;
  }
  if (completed !== undefined) {
    if (typeof completed !== 'boolean') return res.status(400).json({ error: 'completed must be boolean' });
    tasks[idx].completed = completed;
  }
  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) return res.status(400).json({ error: 'invalid priority' });
    tasks[idx].priority = priority;
  }
  if (dueDate !== undefined) {
    if (dueDate === null || dueDate === '') tasks[idx].dueDate = undefined;
    else {
      const validated = validateDueDate(dueDate);
      if (validated === undefined) return res.status(400).json({ error: 'dueDate must be YYYY-MM-DD' });
      tasks[idx].dueDate = validated ?? undefined;
    }
  }
  if (categoryId !== undefined) {
    if (categoryId === null || categoryId === '') tasks[idx].categoryId = undefined;
    else if (typeof categoryId !== 'string' || !categoryBelongsToUser(categoryId, req.userId!)) {
      return res.status(400).json({ error: 'invalid categoryId' });
    } else tasks[idx].categoryId = categoryId;
  }
  if (position !== undefined) {
    if (typeof position !== 'number' || !Number.isFinite(position)) {
      return res.status(400).json({ error: 'position must be a finite number' });
    }
    tasks[idx].position = position;
  }

  writeTasks(tasks);
  res.json(tasks[idx]);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const tasks = readTasks();
  const next = tasks.filter(t => !(t.id === id && t.userId === req.userId));
  if (next.length === tasks.length) return res.status(404).json({ error: 'task not found' });

  writeTasks(next);
  res.status(204).send();
});

export default router;

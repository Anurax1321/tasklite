import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { requireUser } from '../middleware/requireUser';
import { readCategories, writeCategories } from '../categoryStore';
import { readTasks, writeTasks } from '../store';
import { Category } from '../types';

const router = Router();

router.use(requireUser);

router.get('/', (req: Request, res: Response) => {
  const all = readCategories();
  res.json(all.filter(c => c.userId === req.userId));
});

router.post('/', (req: Request, res: Response) => {
  const { name, icon, color } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (typeof icon !== 'string' || icon.length === 0) {
    return res.status(400).json({ error: 'icon is required' });
  }
  if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return res.status(400).json({ error: 'color must be a hex like #2563eb' });
  }

  const category: Category = {
    id: uuid(),
    userId: req.userId!,
    name: name.trim(),
    icon,
    color,
    createdAt: new Date().toISOString(),
  };
  const all = readCategories();
  all.push(category);
  writeCategories(all);
  res.status(201).json(category);
});

router.patch('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, icon, color } = req.body ?? {};

  const all = readCategories();
  const idx = all.findIndex(c => c.id === id && c.userId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'category not found' });

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name must be non-empty' });
    }
    all[idx].name = name.trim();
  }
  if (icon !== undefined) {
    if (typeof icon !== 'string' || icon.length === 0) {
      return res.status(400).json({ error: 'icon must be non-empty' });
    }
    all[idx].icon = icon;
  }
  if (color !== undefined) {
    if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return res.status(400).json({ error: 'color must be hex' });
    }
    all[idx].color = color;
  }

  writeCategories(all);
  res.json(all[idx]);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const all = readCategories();
  const next = all.filter(c => !(c.id === id && c.userId === req.userId));
  if (next.length === all.length) return res.status(404).json({ error: 'category not found' });
  writeCategories(next);

  const tasks = readTasks();
  let changed = false;
  for (const t of tasks) {
    if (t.userId === req.userId && t.categoryId === id) {
      t.categoryId = undefined;
      changed = true;
    }
  }
  if (changed) writeTasks(tasks);

  res.status(204).send();
});

export default router;

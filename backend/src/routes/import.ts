import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { requireUser } from '../middleware/requireUser';
import { readTasks, writeTasks } from '../store';
import { parseIcal } from '../icalParser';
import { Task } from '../types';

const router = Router();
router.use(requireUser);

router.post('/ical', async (req: Request, res: Response) => {
  const { url, content } = req.body ?? {};

  let icsText: string | null = null;
  if (typeof content === 'string' && content.trim().length > 0) {
    icsText = content;
  } else if (typeof url === 'string' && url.trim().length > 0) {
    try {
      const fetched = await fetch(url.replace(/^webcal:/i, 'https:'));
      if (!fetched.ok) {
        return res.status(400).json({ error: `failed to fetch URL (HTTP ${fetched.status})` });
      }
      icsText = await fetched.text();
    } catch (e) {
      return res.status(400).json({ error: `could not fetch URL: ${(e as Error).message}` });
    }
  } else {
    return res.status(400).json({ error: 'provide a `url` or `content` field' });
  }

  const events = parseIcal(icsText);
  if (events.length === 0) {
    return res.status(400).json({ error: 'no events found in calendar data' });
  }

  const all = readTasks();
  const userTasks = all.filter(t => t.userId === req.userId);
  let pos = userTasks.reduce((m, t) => Math.max(m, t.position ?? 0), 0);
  const now = new Date().toISOString();
  const created: Task[] = [];

  for (const ev of events) {
    pos += 1;
    const task: Task = {
      id: uuid(),
      userId: req.userId!,
      title: ev.summary,
      description: ev.description,
      completed: false,
      priority: 'medium',
      dueDate: ev.date,
      position: pos,
      createdAt: now,
    };
    all.push(task);
    created.push(task);
  }
  writeTasks(all);
  res.status(201).json({ imported: created.length, tasks: created });
});

export default router;

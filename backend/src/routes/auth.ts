import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  COOKIE_NAME,
  COOKIE_OPTIONS,
  hashPassword,
  signToken,
  verifyPassword,
  verifyToken,
} from '../auth';
import { findUserByEmail, findUserById, readUsers, writeUsers } from '../userStore';
import { seedCategoriesForUser } from '../categoryStore';
import { User } from '../types';

const router = Router();

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(u: User) {
  return { id: u.id, email: u.email, createdAt: u.createdAt };
}

router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || !EMAIL_RX.test(email)) {
    return res.status(400).json({ error: 'valid email required' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'email already registered' });
  }

  const user: User = {
    id: uuid(),
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  const users = readUsers();
  users.push(user);
  writeUsers(users);
  seedCategoriesForUser(user.id);

  res.cookie(COOKIE_NAME, signToken(user.id), COOKIE_OPTIONS);
  res.status(201).json(publicUser(user));
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password required' });
  }

  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  res.cookie(COOKIE_NAME, signToken(user.id), COOKIE_OPTIONS);
  res.json(publicUser(user));
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).send();
});

router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'not authenticated' });
  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ error: 'invalid session' });
  const user = findUserById(userId);
  if (!user) return res.status(401).json({ error: 'user not found' });
  res.json(publicUser(user));
});

export default router;

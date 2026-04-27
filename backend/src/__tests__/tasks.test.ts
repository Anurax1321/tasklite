import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import type { Express } from 'express';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklite-test-'));
process.env.TASKLITE_DATA_DIR = tmpDir;
process.env.JWT_SECRET = 'test-secret-with-sufficient-length-for-prod-checks';
process.env.NODE_ENV = 'test';

let app: Express;
let cookie: string;

before(async () => {
  app = (await import('../index')).default;
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'test@example.com', password: 'pass1234' });
  assert.equal(res.status, 201);
  const setCookie = res.headers['set-cookie'];
  const raw = Array.isArray(setCookie) ? setCookie[0] : (setCookie as unknown as string);
  cookie = raw.split(';')[0];
});

beforeEach(() => {
  const tasksFile = path.join(tmpDir, 'tasks.json');
  if (fs.existsSync(tasksFile)) fs.writeFileSync(tasksFile, '[]');
});

after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('GET /api/tasks returns empty array for new user', async () => {
  const res = await request(app).get('/api/tasks').set('Cookie', cookie);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});

test('POST /api/tasks creates a task', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Cookie', cookie)
    .send({ title: 'Buy milk' });
  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Buy milk');
  assert.equal(res.body.completed, false);
  assert.equal(res.body.priority, 'medium');
});

test('PATCH /api/tasks/:id toggles completion', async () => {
  const created = await request(app)
    .post('/api/tasks')
    .set('Cookie', cookie)
    .send({ title: 'Toggle me' });

  const patched = await request(app)
    .patch(`/api/tasks/${created.body.id}`)
    .set('Cookie', cookie)
    .send({ completed: true });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.completed, true);
});

test('DELETE /api/tasks/:id removes the task', async () => {
  const created = await request(app)
    .post('/api/tasks')
    .set('Cookie', cookie)
    .send({ title: 'Doomed' });

  const del = await request(app)
    .delete(`/api/tasks/${created.body.id}`)
    .set('Cookie', cookie);
  assert.equal(del.status, 204);

  const list = await request(app).get('/api/tasks').set('Cookie', cookie);
  assert.equal(list.body.length, 0);
});

test('POST /api/tasks rejects empty title', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Cookie', cookie)
    .send({ title: '   ' });
  assert.equal(res.status, 400);
});

test('POST /api/tasks rejects invalid date (Feb 31)', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Cookie', cookie)
    .send({ title: 'Bad date', dueDate: '2026-02-31' });
  assert.equal(res.status, 400);
});

test('GET /api/tasks rejects unauthenticated requests', async () => {
  const res = await request(app).get('/api/tasks');
  assert.equal(res.status, 401);
});

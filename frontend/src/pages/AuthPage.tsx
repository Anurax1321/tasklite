import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { categoriesApi, tasksApi } from '../api';
import { clearGuestData, readGuestCategoriesRaw, readGuestTasksRaw } from '../stores/LocalStore';

type Mode = 'login' | 'signup';

async function migrateGuestData(): Promise<number> {
  const guestCats = readGuestCategoriesRaw();
  const guestTasks = readGuestTasksRaw();
  if (guestTasks.length === 0 && guestCats.length === 0) return 0;

  const serverCats = await categoriesApi.list();
  const idMap = new Map<string, string>();
  for (const gc of guestCats) {
    const match = serverCats.find(sc => sc.name.toLowerCase() === gc.name.toLowerCase());
    if (match) {
      idMap.set(gc.id, match.id);
    } else {
      const created = await categoriesApi.create({ name: gc.name, icon: gc.icon, color: gc.color });
      idMap.set(gc.id, created.id);
    }
  }

  let imported = 0;
  for (const t of guestTasks) {
    const mappedCat = t.categoryId ? idMap.get(t.categoryId) : undefined;
    const created = await tasksApi.create({
      title: t.title,
      description: t.description,
      categoryId: mappedCat,
      priority: t.priority,
      dueDate: t.dueDate,
    });
    if (t.completed) {
      await tasksApi.update(created.id, { completed: true });
    }
    imported++;
  }

  clearGuestData();
  return imported;
}

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signup(email, password);
        const n = await migrateGuestData().catch(() => 0);
        navigate('/', { state: { migrated: n }, replace: true });
      } else {
        await login(email, password);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Tasklite</h1>
        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Log in
          </button>
          <button
            className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => setMode('signup')}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? '...' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="auth-foot">
          <Link to="/">Continue as guest</Link>
          <span className="muted"> · data stays in this browser</span>
        </p>
      </div>
    </div>
  );
}

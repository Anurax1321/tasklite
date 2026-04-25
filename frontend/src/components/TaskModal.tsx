import { FormEvent, useEffect, useState } from 'react';
import { PRIORITIES } from '../constants';
import { Category, Priority, Task, TaskInput, TaskPatch } from '../types';

interface Props {
  open: boolean;
  task?: Task | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (input: TaskInput | TaskPatch, id?: string) => Promise<void>;
}

export function TaskModal({ open, task, categories, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setCategoryId(task?.categoryId ?? '');
      setPriority(task?.priority ?? 'medium');
      setDueDate(task?.dueDate ?? '');
      setError(null);
    }
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: TaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        priority,
        dueDate: dueDate || undefined,
      };
      await onSubmit(payload, task?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{task ? 'Edit task' : 'New task'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </label>

          <label>
            Category
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span>Priority</span>
            <div className="priority-pills">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={`pill${priority === p.value ? ' selected' : ''}`}
                  style={priority === p.value ? { background: p.color, color: '#fff', borderColor: p.color } : {}}
                  onClick={() => setPriority(p.value)}
                >
                  <span className="pill-dot" style={{ background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving...' : task ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

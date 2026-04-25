import { useState } from 'react';
import { COLOR_CHOICES, ICON_CHOICES } from '../constants';
import { Category } from '../types';

interface Props {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (input: { name: string; icon: string; color: string }) => Promise<void>;
  onUpdate: (id: string, patch: { name?: string; icon?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  taskCounts: Record<string, number>;
  totalCount: number;
}

interface Draft { name: string; icon: string; color: string; id?: string }

export function CategorySidebar({
  categories,
  selected,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  taskCounts,
  totalCount,
}: Props) {
  const [editing, setEditing] = useState<Draft | null>(null);

  function startNew() {
    setEditing({ name: '', icon: ICON_CHOICES[0], color: COLOR_CHOICES[0] });
  }
  function startEdit(c: Category) {
    setEditing({ id: c.id, name: c.name, icon: c.icon, color: c.color });
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return;
    if (editing.id) {
      await onUpdate(editing.id, { name: editing.name.trim(), icon: editing.icon, color: editing.color });
    } else {
      await onCreate({ name: editing.name.trim(), icon: editing.icon, color: editing.color });
    }
    setEditing(null);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h3>Categories</h3>
        <button className="icon-btn" onClick={startNew} title="New category">+</button>
      </div>

      <ul className="cat-list">
        <li
          className={`cat-row${selected === null ? ' selected' : ''}`}
          onClick={() => onSelect(null)}
        >
          <span className="cat-icon">📋</span>
          <span className="cat-name">All</span>
          <span className="cat-count">{totalCount}</span>
        </li>
        {categories.map(c => (
          <li
            key={c.id}
            className={`cat-row${selected === c.id ? ' selected' : ''}`}
            style={{ '--cat-color': c.color } as React.CSSProperties}
            onClick={() => onSelect(c.id)}
          >
            <span className="cat-icon">{c.icon}</span>
            <span className="cat-name">{c.name}</span>
            <span className="cat-count">{taskCounts[c.id] ?? 0}</span>
            <span className="cat-row-actions">
              <button
                className="mini-btn"
                onClick={e => { e.stopPropagation(); startEdit(c); }}
                title="Edit"
              >✎</button>
              <button
                className="mini-btn danger"
                onClick={e => {
                  e.stopPropagation();
                  if (confirm(`Delete category "${c.name}"? Tasks will be uncategorized.`)) onDelete(c.id);
                }}
                title="Delete"
              >✕</button>
            </span>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal small" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editing.id ? 'Edit category' : 'New category'}</h2>
              <button className="icon-btn" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="modal-form">
              <label>
                Name
                <input
                  type="text"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  autoFocus
                />
              </label>
              <div className="field">
                <span>Icon</span>
                <div className="icon-grid">
                  {ICON_CHOICES.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      className={`icon-tile${editing.icon === ic ? ' selected' : ''}`}
                      onClick={() => setEditing({ ...editing, icon: ic })}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span>Color</span>
                <div className="color-grid">
                  {COLOR_CHOICES.map(col => (
                    <button
                      key={col}
                      type="button"
                      className={`color-swatch${editing.color === col ? ' selected' : ''}`}
                      style={{ background: col }}
                      onClick={() => setEditing({ ...editing, color: col })}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn-primary" onClick={save}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

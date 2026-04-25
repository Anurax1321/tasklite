import { useMemo, useState } from 'react';
import { PRIORITIES, PRIORITY_RANK } from '../constants';
import { Priority, Task } from '../types';

interface Props {
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onOpenImport?: () => void;
}

type ShowFilter = 'all' | 'pending' | 'completed';

function ymd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildGrid(monthAnchor: Date): Date[] {
  const first = startOfMonth(monthAnchor);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function Calendar({ tasks, selectedDate, onSelectDate, onOpenImport }: Props) {
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set(['low', 'medium', 'high']));
  const [showFilter, setShowFilter] = useState<ShowFilter>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      if (!priorityFilter.has(t.priority)) return false;
      if (showFilter === 'pending' && t.completed) return false;
      if (showFilter === 'completed' && !t.completed) return false;
      return true;
    });
  }, [tasks, priorityFilter, showFilter]);

  const dayDots = useMemo(() => {
    const map = new Map<string, Priority>();
    for (const t of filteredTasks) {
      const d = t.dueDate!;
      const existing = map.get(d);
      if (!existing || PRIORITY_RANK[t.priority] > PRIORITY_RANK[existing]) {
        map.set(d, t.priority);
      }
    }
    return map;
  }, [filteredTasks]);

  const grid = buildGrid(anchor);
  const monthLabel = anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const today = ymd(new Date());

  function togglePriority(p: Priority) {
    const next = new Set(priorityFilter);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setPriorityFilter(next);
  }

  return (
    <section className="calendar">
      <div className="cal-head">
        <button className="icon-btn" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
        <h3>{monthLabel}</h3>
        <button className="icon-btn" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))} aria-label="Next month">›</button>
        <button
          className="btn-ghost small"
          onClick={() => { setAnchor(startOfMonth(new Date())); onSelectDate(today); }}
        >Today</button>
        {onOpenImport && (
          <button
            className="icon-btn"
            onClick={onOpenImport}
            title="Import from calendar (.ics)"
            aria-label="Import from calendar"
          >📥</button>
        )}
      </div>

      <div className="cal-filters">
        <div className="cal-filter-group">
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              className={`pill small${priorityFilter.has(p.value) ? ' selected' : ''}`}
              style={priorityFilter.has(p.value) ? { borderColor: p.color, color: p.color } : {}}
              onClick={() => togglePriority(p.value)}
            >
              <span className="pill-dot" style={{ background: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
        <select
          className="cal-show"
          value={showFilter}
          onChange={e => setShowFilter(e.target.value as ShowFilter)}
        >
          <option value="all">All tasks</option>
          <option value="pending">Pending only</option>
          <option value="completed">Completed only</option>
        </select>
      </div>

      <div className="cal-weekdays">
        {['S','M','T','W','T','F','S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>

      <div className="cal-grid">
        {grid.map(d => {
          const key = ymd(d);
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const dot = dayDots.get(key);
          const dotColor = dot ? PRIORITIES.find(p => p.value === dot)?.color : null;
          return (
            <button
              key={key}
              className={`cal-day${inMonth ? '' : ' faded'}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => onSelectDate(isSelected ? null : key)}
            >
              <span className="cal-num">{d.getDate()}</span>
              {dot && <span className="cal-dot" style={{ background: dotColor ?? undefined }} />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="cal-clear">
          Showing tasks for <strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })}</strong>
          <button className="btn-ghost small" onClick={() => onSelectDate(null)}>Clear</button>
        </div>
      )}
    </section>
  );
}

import { PRIORITIES } from '../constants';
import { Priority } from '../types';

export type ShowFilter = 'all' | 'pending' | 'completed';

interface Props {
  priorityFilter: Set<Priority>;
  onTogglePriority: (p: Priority) => void;
  showFilter: ShowFilter;
  onShowFilterChange: (s: ShowFilter) => void;
}

export function CalendarFilters({
  priorityFilter,
  onTogglePriority,
  showFilter,
  onShowFilterChange,
}: Props) {
  return (
    <div className="cal-filters">
      <div className="cal-filter-group">
        {PRIORITIES.map(p => (
          <button
            key={p.value}
            className={`pill small${priorityFilter.has(p.value) ? ' selected' : ''}`}
            style={priorityFilter.has(p.value) ? { borderColor: p.color, color: p.color } : {}}
            onClick={() => onTogglePriority(p.value)}
          >
            <span className="pill-dot" style={{ background: p.color }} />
            {p.label}
          </button>
        ))}
      </div>
      <select
        className="cal-show"
        value={showFilter}
        onChange={e => onShowFilterChange(e.target.value as ShowFilter)}
      >
        <option value="all">All tasks</option>
        <option value="pending">Pending only</option>
        <option value="completed">Completed only</option>
      </select>
    </div>
  );
}

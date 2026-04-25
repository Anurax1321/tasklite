import { DragEvent } from 'react';
import { PRIORITIES } from '../constants';
import { Category, Task } from '../types';

interface Props {
  task: Task;
  category?: Category;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLLIElement>, id: string) => void;
  onDragOver?: (e: DragEvent<HTMLLIElement>, id: string) => void;
  onDrop?: (e: DragEvent<HTMLLIElement>, id: string) => void;
  onDragEnd?: (e: DragEvent<HTMLLIElement>) => void;
  isDraggingOver?: boolean;
}

function formatDue(iso: string): { label: string; tone: 'normal' | 'soon' | 'overdue' } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso + 'T00:00:00');
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  let label: string;
  if (diff === 0) label = 'Today';
  else if (diff === 1) label = 'Tomorrow';
  else if (diff === -1) label = 'Yesterday';
  else if (diff > 1 && diff < 7) label = `In ${diff} days`;
  else label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  let tone: 'normal' | 'soon' | 'overdue' = 'normal';
  if (diff < 0) tone = 'overdue';
  else if (diff <= 2) tone = 'soon';
  return { label, tone };
}

export function TaskItem({
  task,
  category,
  onToggle,
  onDelete,
  onEdit,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDraggingOver,
}: Props) {
  const due = task.dueDate ? formatDue(task.dueDate) : null;
  const dueClass = task.completed ? 'done' : due?.tone ?? 'normal';
  const borderColor = category?.color ?? 'var(--border-strong)';
  const priorityMeta = PRIORITIES.find(p => p.value === task.priority);

  return (
    <li
      className={`task-card${task.completed ? ' completed' : ''}${isDraggingOver ? ' drop-target' : ''}`}
      style={{ borderLeftColor: borderColor }}
      draggable={draggable}
      onDragStart={onDragStart && (e => onDragStart(e, task.id))}
      onDragOver={onDragOver && (e => onDragOver(e, task.id))}
      onDrop={onDrop && (e => onDrop(e, task.id))}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
      role="button"
    >
      {draggable && (
        <span className="drag-handle" title="Drag to reorder" onClick={e => e.stopPropagation()}>
          ⋮⋮
        </span>
      )}
      <input
        type="checkbox"
        className="task-check"
        checked={task.completed}
        onChange={e => onToggle(task.id, e.target.checked)}
        onClick={e => e.stopPropagation()}
      />
      <div className="task-main">
        <div className="task-title-row">
          <span className="task-title">{task.title}</span>
          <span
            className="priority-pin"
            style={{ background: priorityMeta?.color }}
            title={`Priority: ${priorityMeta?.label}`}
          />
        </div>
        {(category || due) && (
          <div className="task-meta">
            {category && (
              <span
                className="chip"
                style={{ background: `${category.color}22`, color: category.color }}
              >
                <span className="chip-icon">{category.icon}</span>
                {category.name}
              </span>
            )}
            {due && <span className={`due due-${dueClass}`}>📅 {due.label}</span>}
          </div>
        )}
      </div>
      <button
        className="icon-btn danger"
        title="Delete"
        onClick={e => {
          e.stopPropagation();
          onDelete(task.id);
        }}
      >
        ✕
      </button>
    </li>
  );
}

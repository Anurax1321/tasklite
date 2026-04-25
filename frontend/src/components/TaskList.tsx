import { DragEvent, useState } from 'react';
import { Category, Task } from '../types';
import { TaskItem } from './TaskItem';

interface Props {
  tasks: Task[];
  categories: Category[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
  emptyText?: string;
}

export function TaskList({
  tasks,
  categories,
  onToggle,
  onDelete,
  onEdit,
  onReorder,
  emptyText,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return <p className="empty">{emptyText ?? 'Nothing here. Add a task to get started.'}</p>;
  }

  const catById = new Map(categories.map(c => [c.id, c]));
  const dndEnabled = !!onReorder;

  function handleDragStart(e: DragEvent<HTMLLIElement>, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }
  function handleDragOver(e: DragEvent<HTMLLIElement>, id: string) {
    if (!draggingId || id === draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverId(id);
  }
  function handleDrop(e: DragEvent<HTMLLIElement>, id: string) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain') || draggingId;
    if (draggedId && draggedId !== id && onReorder) onReorder(draggedId, id);
    setDraggingId(null);
    setOverId(null);
  }
  function handleDragEnd() {
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <ul className="task-list">
      {tasks.map(t => (
        <TaskItem
          key={t.id}
          task={t}
          category={t.categoryId ? catById.get(t.categoryId) : undefined}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          draggable={dndEnabled}
          onDragStart={dndEnabled ? handleDragStart : undefined}
          onDragOver={dndEnabled ? handleDragOver : undefined}
          onDrop={dndEnabled ? handleDrop : undefined}
          onDragEnd={dndEnabled ? handleDragEnd : undefined}
          isDraggingOver={overId === t.id && draggingId !== t.id}
        />
      ))}
    </ul>
  );
}

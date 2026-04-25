import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { CategorySidebar } from '../components/CategorySidebar';
import { Calendar } from '../components/Calendar';
import { TaskInput } from '../components/TaskInput';
import { TaskList } from '../components/TaskList';
import { TaskModal } from '../components/TaskModal';
import { ImportDialog } from '../components/ImportDialog';
import { useStores } from '../stores/useStores';
import { Category, Task, TaskInput as TaskInputT, TaskPatch } from '../types';

export function TasksPage() {
  const { tasks: taskStore, categories: categoryStore } = useStores();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([taskStore.list(), categoryStore.list()]);
      setTasks(t);
      setCategories(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, [taskStore, categoryStore]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const state = location.state as { migrated?: number } | null;
    if (state?.migrated && state.migrated > 0) {
      setToast(`Imported ${state.migrated} task${state.migrated === 1 ? '' : 's'} from guest mode`);
      navigate(location.pathname, { replace: true, state: null });
      const id = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(id);
    }
  }, [location, navigate]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedCategory && t.categoryId !== selectedCategory) return false;
      if (selectedDate && t.dueDate !== selectedDate) return false;
      return true;
    });
  }, [tasks, selectedCategory, selectedDate]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.position ?? 0) - (b.position ?? 0);
    });
  }, [filteredTasks]);

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

  async function handleQuickAdd(title: string) {
    try {
      await taskStore.create({ title, priority: 'medium' });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Add failed');
    }
  }

  async function handleToggle(id: string, completed: boolean) {
    try {
      await taskStore.update(id, { completed });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  }

  async function handleDelete(id: string) {
    try {
      await taskStore.remove(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  async function handleModalSubmit(input: TaskInputT | TaskPatch, id?: string) {
    if (id) await taskStore.update(id, input as TaskPatch);
    else await taskStore.create(input as TaskInputT);
    await refresh();
  }

  async function handleReorder(draggedId: string, targetId: string) {
    const ordered = [...sortedTasks];
    const fromIdx = ordered.findIndex(t => t.id === draggedId);
    const toIdx = ordered.findIndex(t => t.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, moved);

    setTasks(prev => {
      const next = prev.map(t => {
        const newIdx = ordered.findIndex(o => o.id === t.id);
        if (newIdx === -1) return t;
        return { ...t, position: newIdx + 1 };
      });
      return next;
    });

    try {
      await Promise.all(
        ordered.map((t, i) => {
          const newPos = i + 1;
          if (t.position !== newPos) return taskStore.update(t.id, { position: newPos });
          return Promise.resolve(t);
        }),
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reorder failed');
      await refresh();
    }
  }

  function openNewModal() {
    setEditingTask(null);
    setModalOpen(true);
  }
  function openEditModal(t: Task) {
    setEditingTask(t);
    setModalOpen(true);
  }

  return (
    <div className="page">
      <TopBar onOpenImport={() => setImportOpen(true)} />

      {toast && <div className="toast">{toast}</div>}

      <div className="layout">
        <CategorySidebar
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          onCreate={async input => { await categoryStore.create(input); await refresh(); }}
          onUpdate={async (id, patch) => { await categoryStore.update(id, patch); await refresh(); }}
          onDelete={async id => { await categoryStore.remove(id); await refresh(); }}
          taskCounts={taskCounts}
          totalCount={tasks.length}
        />

        <main className="main-col">
          {error && <p className="auth-error">{error}</p>}
          <TaskInput onQuickAdd={handleQuickAdd} onOpenModal={openNewModal} />
          <TaskList
            tasks={sortedTasks}
            categories={categories}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={openEditModal}
            onReorder={handleReorder}
            emptyText={
              selectedDate
                ? 'No tasks due on this day.'
                : selectedCategory
                  ? 'No tasks in this category.'
                  : 'Nothing here. Add a task to get started.'
            }
          />
        </main>

        <aside className="right-col">
          <Calendar
            tasks={tasks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenImport={() => setImportOpen(true)}
          />
        </aside>
      </div>

      <TaskModal
        open={modalOpen}
        task={editingTask}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={async n => {
          await refresh();
          setToast(`Imported ${n} task${n === 1 ? '' : 's'} from calendar`);
          setTimeout(() => setToast(null), 4000);
        }}
      />

      <footer className="credit">
        <span>Built by Anurag Chinnaboina · © {new Date().getFullYear()}</span>
        <a
          className="credit-icon"
          href="https://github.com/Anurax1321"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          title="GitHub"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
        <a
          className="credit-icon"
          href="https://www.linkedin.com/in/anuragchinnaboina"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          title="LinkedIn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </footer>
    </div>
  );
}

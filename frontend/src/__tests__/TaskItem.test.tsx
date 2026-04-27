import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TaskItem } from '../components/TaskItem';
import { Task } from '../types';

afterEach(cleanup);

const baseTask: Task = {
  id: 't1',
  title: 'Write tests',
  completed: false,
  priority: 'medium',
  position: 1,
  createdAt: new Date().toISOString(),
};

describe('TaskItem', () => {
  it('toggles completion via the checkbox', () => {
    const onToggle = vi.fn();
    render(
      <ul>
        <TaskItem
          task={baseTask}
          onToggle={onToggle}
          onDelete={() => {}}
          onEdit={() => {}}
        />
      </ul>,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('t1', true);
  });

  it('calls onDelete when the delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <ul>
        <TaskItem
          task={baseTask}
          onToggle={() => {}}
          onDelete={onDelete}
          onEdit={() => {}}
        />
      </ul>,
    );
    const deleteBtn = screen.getByText('✕');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('t1');
  });
});

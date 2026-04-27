import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TaskInput } from '../components/TaskInput';

afterEach(cleanup);

describe('TaskInput', () => {
  it('calls onQuickAdd with the trimmed title and clears the input', async () => {
    const onQuickAdd = vi.fn().mockResolvedValue(undefined);
    render(<TaskInput onQuickAdd={onQuickAdd} onOpenModal={() => {}} />);

    const input = screen.getByPlaceholderText(/quick add/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  Buy milk  ' } });
    const submit = screen
      .getAllByRole('button')
      .find(b => b.getAttribute('type') === 'submit')!;
    fireEvent.click(submit);

    await vi.waitFor(() => {
      expect(onQuickAdd).toHaveBeenCalledWith('Buy milk');
    });
    await vi.waitFor(() => expect(input.value).toBe(''));
  });

  it('does not submit when the title is empty', () => {
    const onQuickAdd = vi.fn();
    render(<TaskInput onQuickAdd={onQuickAdd} onOpenModal={() => {}} />);
    const submit = screen
      .getAllByRole('button')
      .find(b => b.getAttribute('type') === 'submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });
});

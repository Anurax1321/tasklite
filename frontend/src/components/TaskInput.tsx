import { FormEvent, useState } from 'react';

interface Props {
  onQuickAdd: (title: string) => Promise<void> | void;
  onOpenModal: () => void;
}

export function TaskInput({ onQuickAdd, onOpenModal }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    setBusy(true);
    try {
      await onQuickAdd(title);
      setValue('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="quick-add" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Quick add a task..."
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={busy}
      />
      <button type="submit" className="btn-primary" disabled={busy || !value.trim()}>
        Add
      </button>
      <button
        type="button"
        className="fab"
        onClick={onOpenModal}
        title="Add with details"
        aria-label="Add with details"
      >
        +
      </button>
    </form>
  );
}

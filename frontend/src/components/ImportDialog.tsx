import { useState } from 'react';
import { importApi } from '../api';
import { useAuth } from '../auth/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (n: number) => void;
}

type Mode = 'url' | 'paste';

export function ImportDialog({ open, onClose, onImported }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      const payload = mode === 'url' ? { url } : { content };
      const result = await importApi.ical(payload);
      onImported(result.imported);
      onClose();
      setUrl('');
      setContent('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>Import from calendar</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!user ? (
          <div className="modal-form">
            <p className="muted" style={{ margin: 0 }}>
              Importing requires an account so your imported tasks can persist across devices.
              {' '}<a href="/auth">Sign up or log in</a>.
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <div className="modal-form">
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              Paste the public <strong>.ics</strong> URL of any calendar (Google: Calendar Settings →
              Integrate calendar → Public address in iCal format), or paste the file contents directly.
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab${mode === 'url' ? ' active' : ''}`}
                onClick={() => setMode('url')}
              >From URL</button>
              <button
                type="button"
                className={`auth-tab${mode === 'paste' ? ' active' : ''}`}
                onClick={() => setMode('paste')}
              >Paste .ics</button>
            </div>

            {mode === 'url' ? (
              <label>
                Calendar URL
                <input
                  type="url"
                  placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  autoFocus
                />
              </label>
            ) : (
              <label>
                .ics content
                <textarea
                  rows={8}
                  placeholder="BEGIN:VCALENDAR..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  autoFocus
                />
              </label>
            )}

            {error && <p className="auth-error">{error}</p>}

            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={busy || (mode === 'url' ? !url.trim() : !content.trim())}
              >
                {busy ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

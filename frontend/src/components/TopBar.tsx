import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  onOpenImport?: () => void;
}

export function TopBar({ onOpenImport }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <h1 className="brand">Tasklite</h1>
        <div className="topbar-actions">
          {onOpenImport && (
            <button
              className="btn-ghost small"
              onClick={onOpenImport}
              title="Import from a calendar (.ics URL or paste)"
            >
              📥 Import
            </button>
          )}
          <button
            className="icon-btn"
            onClick={toggle}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user ? (
            <>
              <span className="user-email" title={user.email}>{user.email}</span>
              <button className="btn-ghost" onClick={() => logout()}>Log out</button>
            </>
          ) : (
            <Link to="/auth" className="btn-primary small">Log in</Link>
          )}
        </div>
      </div>
      {!user && (
        <div className="guest-banner">
          You're in <strong>guest mode</strong>. Tasks are saved in this browser only.
          {' '}<Link to="/auth">Sign up</Link> to keep them across devices.
        </div>
      )}
    </header>
  );
}

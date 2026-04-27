import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { StorageKeys } from '../storageKeys';

interface Props {
  onOpenImport?: () => void;
}

export function TopBar({ onOpenImport }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem(StorageKeys.guestBannerDismissed) === '1',
  );

  function dismissBanner() {
    localStorage.setItem(StorageKeys.guestBannerDismissed, '1');
    setBannerDismissed(true);
  }

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
      {!user && !bannerDismissed && (
        <div className="guest-banner">
          <span>
            You're in <strong>guest mode</strong>. Tasks are saved in this browser only.
            {' '}<Link to="/auth">Sign up</Link> to keep them across devices.
          </span>
          <button
            className="banner-close"
            onClick={dismissBanner}
            aria-label="Dismiss"
            title="Dismiss"
          >✕</button>
        </div>
      )}
    </header>
  );
}

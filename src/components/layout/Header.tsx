import { NavLink } from 'react-router-dom';
import { TABS } from '../../lib/constants';
import { useAuthContext } from '../../hooks/AuthContext';

export default function Header() {
  const { user, signOut } = useAuthContext();

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gold rounded-sm" />
          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-widest text-gold leading-none">
              MOEX — МОСКОВСКАЯ БИРЖА
            </h1>
            <p className="text-xs text-muted">
              Дашборд коммерческого директора &bull; тикер MOEX
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <nav className="flex gap-1 bg-bg-card2 rounded-lg p-1">
            {TABS.map(tab => (
              <NavLink
                key={tab.key}
                to={tab.path}
                end={tab.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-gold text-bg font-bold'
                      : 'text-muted hover:text-white'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          {user && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted truncate max-w-[150px]">{user.email}</span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs font-mono text-muted hover:text-white border border-gray-700 rounded-md transition-colors"
              >
                Выход
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

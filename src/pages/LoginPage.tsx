import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/AuthContext';

export default function LoginPage() {
  const { session, loading, signIn, signUp } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="skeleton h-8 w-48" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const err = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (err) {
      setError(err.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="bg-bg-card rounded-xl border border-gray-800 p-8 w-full max-w-md fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-8 bg-gold rounded-sm" />
          <h1 className="font-display text-3xl tracking-widest text-gold">MOEX DASHBOARD</h1>
        </div>
        <p className="text-muted text-sm mb-6">
          {mode === 'login' ? 'Вход в систему' : 'Регистрация'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-bg-card2 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-muted focus:border-gold/50 focus:outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 bg-bg-card2 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-muted focus:border-gold/50 focus:outline-none transition-colors"
          />

          {error && (
            <div className="text-danger text-xs bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-gold text-bg font-bold rounded-lg text-sm font-mono hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-xs text-muted hover:text-gold transition-colors"
          >
            {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}

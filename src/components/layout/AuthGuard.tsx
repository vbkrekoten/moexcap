import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { session, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="skeleton h-8 w-48" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

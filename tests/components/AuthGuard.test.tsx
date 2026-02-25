import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthGuard from '../../src/components/layout/AuthGuard';

// Mock the auth context
vi.mock('../../src/hooks/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));

import { useAuthContext } from '../../src/hooks/AuthContext';
const mockUseAuth = vi.mocked(useAuthContext);

describe('AuthGuard', () => {
  it('shows loading skeleton when auth is loading', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: true } as ReturnType<typeof useAuthContext>);
    const { container } = render(
      <MemoryRouter>
        <AuthGuard><div>Protected</div></AuthGuard>
      </MemoryRouter>
    );
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Protected')).toBeNull();
  });

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: '1' } } as any,
      loading: false,
    } as ReturnType<typeof useAuthContext>);
    render(
      <MemoryRouter>
        <AuthGuard><div>Protected Content</div></AuthGuard>
      </MemoryRouter>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false } as ReturnType<typeof useAuthContext>);
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthGuard><div>Protected</div></AuthGuard>
      </MemoryRouter>
    );
    expect(screen.queryByText('Protected')).toBeNull();
  });
});

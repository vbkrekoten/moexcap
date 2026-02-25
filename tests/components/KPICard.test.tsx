import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KPICard from '../../src/components/ui/KPICard';

describe('KPICard', () => {
  it('renders label and value', () => {
    render(<KPICard label="Test Label" value="123" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<KPICard label="Price" value="200" subtitle="as of today" />);
    expect(screen.getByText('as of today')).toBeInTheDocument();
  });

  it('renders positive change in green', () => {
    render(<KPICard label="Growth" value="100" change={5.5} />);
    const changeEl = screen.getByText('+5.5%');
    expect(changeEl).toBeInTheDocument();
    expect(changeEl.className).toContain('text-green');
  });

  it('renders negative change in red', () => {
    render(<KPICard label="Loss" value="80" change={-3.2} />);
    const changeEl = screen.getByText('-3.2%');
    expect(changeEl).toBeInTheDocument();
    expect(changeEl.className).toContain('text-danger');
  });

  it('shows skeleton when loading', () => {
    const { container } = render(<KPICard label="Test" value="1" loading />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('does not show change when null', () => {
    render(<KPICard label="No Change" value="50" change={null} />);
    expect(screen.queryByText('%')).toBeNull();
  });
});

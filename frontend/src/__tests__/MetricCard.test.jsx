/**
 * Tests for MetricCard component.
 * Requirements: 1.19, 1.20, 3.3–3.5, 3.13, 3.14, 8.20, 9.9
 */
import { render, screen } from '@testing-library/react';
import MetricCard from '../components/dashboard/MetricCard';

describe('MetricCard', () => {
  test('renders skeleton (animate-pulse) when value is undefined', () => {
    const { container } = render(
      <MetricCard icon="💰" label="Revenue" value={undefined} />
    );
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  test('does NOT render skeleton when value is provided', () => {
    const { container } = render(
      <MetricCard icon="💰" label="Revenue" value={5000} />
    );
    // The card itself shouldn't be the skeleton
    const card = container.firstChild;
    expect(card.className).not.toContain('animate-pulse');
  });

  test('renders the label text', () => {
    render(<MetricCard icon="💰" label="Total Revenue" value={5000} />);
    expect(screen.getByText('Total Revenue')).toBeTruthy();
  });

  test('renders the value', () => {
    render(<MetricCard icon="💰" label="Revenue" value={5000} />);
    expect(screen.getByText('5000')).toBeTruthy();
  });

  test('renders green upward badge when comparison.pct > 0', () => {
    render(
      <MetricCard
        icon="📈"
        label="Revenue"
        value={5000}
        comparison={{ pct: 25, delta: 1000, period: 'week' }}
      />
    );
    const badge = screen.getByText(/↑.*25%.*vs\. last week/i);
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('text-green-700');
  });

  test('renders red downward badge when comparison.pct < 0', () => {
    render(
      <MetricCard
        icon="📉"
        label="Revenue"
        value={3000}
        comparison={{ pct: -20, delta: -1000, period: 'month' }}
      />
    );
    const badge = screen.getByText(/↓.*-20%.*vs\. last month/i);
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('text-red-700');
  });

  test('renders neutral gray badge when comparison.pct === 0', () => {
    render(
      <MetricCard
        icon="📊"
        label="Revenue"
        value={4000}
        comparison={{ pct: 0, delta: 0, period: 'today' }}
      />
    );
    const badge = screen.getByText(/→.*0%.*vs\. last today/i);
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('text-gray-500');
  });

  test('renders "No previous data" when comparison is null', () => {
    render(
      <MetricCard icon="📊" label="Revenue" value={4000} comparison={null} />
    );
    expect(screen.getByText('No previous data')).toBeTruthy();
  });

  test('does NOT render comparison section when comparison is undefined', () => {
    render(<MetricCard icon="📊" label="Revenue" value={4000} />);
    expect(screen.queryByText('No previous data')).toBeNull();
    expect(screen.queryByText(/vs\./i)).toBeNull();
  });

  test('renders unit suffix when provided', () => {
    render(<MetricCard icon="%" label="Rate" value={85} unit="%" />);
    expect(screen.getByText('%')).toBeTruthy();
  });
});

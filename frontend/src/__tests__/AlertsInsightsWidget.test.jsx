/**
 * Tests for AlertsInsightsWidget component.
 * Requirements: 5.2, 5.12–5.19, 9.13
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AlertsInsightsWidget from '../components/dashboard/AlertsInsightsWidget';

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

const sampleAlerts = [
  {
    id: 'revenue-drop',
    severity: 'HIGH',
    title: 'Revenue Drop',
    description: 'Revenue dropped significantly.',
    action: 'Review records.',
    link: '/clinic/revenue',
  },
  {
    id: 'high-cancellation',
    severity: 'MEDIUM',
    title: 'High Cancellation Rate',
    description: 'More than 15% cancelled.',
    action: 'Contact patients.',
    link: '/clinic/appointments',
  },
];

describe('AlertsInsightsWidget', () => {
  test('shows "All Good" message when alerts array is empty', () => {
    render(<AlertsInsightsWidget alerts={[]} onDismiss={jest.fn()} />, { wrapper });
    expect(screen.getByText('All Good')).toBeTruthy();
  });

  test('does NOT show "All Good" when alerts has items', () => {
    render(<AlertsInsightsWidget alerts={sampleAlerts} onDismiss={jest.fn()} />, { wrapper });
    expect(screen.queryByText('All Good')).toBeNull();
  });

  test('renders the title for each alert', () => {
    render(<AlertsInsightsWidget alerts={sampleAlerts} onDismiss={jest.fn()} />, { wrapper });
    expect(screen.getByText('Revenue Drop')).toBeTruthy();
    expect(screen.getByText('High Cancellation Rate')).toBeTruthy();
  });

  test('renders description and action for each alert', () => {
    render(<AlertsInsightsWidget alerts={sampleAlerts} onDismiss={jest.fn()} />, { wrapper });
    expect(screen.getByText('Revenue dropped significantly.')).toBeTruthy();
    expect(screen.getByText('Review records.')).toBeTruthy();
  });

  test('calls onDismiss with correct id when × button is clicked', () => {
    const onDismiss = jest.fn();
    render(<AlertsInsightsWidget alerts={sampleAlerts} onDismiss={onDismiss} />, { wrapper });
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss alert/i });
    fireEvent.click(dismissButtons[0]);
    expect(onDismiss).toHaveBeenCalledWith('revenue-drop');
  });

  test('shows "View Details →" link when alert has link property', () => {
    render(<AlertsInsightsWidget alerts={sampleAlerts} onDismiss={jest.fn()} />, { wrapper });
    const links = screen.getAllByText('View Details →');
    expect(links.length).toBe(2);
  });

  test('does NOT show "View Details →" when alert has no link', () => {
    const alertWithoutLink = [
      { id: 'test', severity: 'LOW', title: 'Test Alert' },
    ];
    render(<AlertsInsightsWidget alerts={alertWithoutLink} onDismiss={jest.fn()} />, { wrapper });
    expect(screen.queryByText('View Details →')).toBeNull();
  });

  test('renders the "Insights & Alerts" section heading when alerts exist', () => {
    render(<AlertsInsightsWidget alerts={sampleAlerts} onDismiss={jest.fn()} />, { wrapper });
    expect(screen.getByText('Insights & Alerts')).toBeTruthy();
  });
});

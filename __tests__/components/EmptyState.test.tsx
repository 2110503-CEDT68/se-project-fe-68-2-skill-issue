import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyState from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders icon, title, and message', () => {
    render(<EmptyState icon="📋" title="No Bookings" message="You have no bookings yet." />);
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('No Bookings')).toBeInTheDocument();
    expect(screen.getByText('You have no bookings yet.')).toBeInTheDocument();
  });

  it('renders optional action', () => {
    render(
      <EmptyState
        icon="🔍"
        title="Empty"
        message="Nothing here"
        action={<button>Book Now</button>}
      />
    );
    expect(screen.getByText('Book Now')).toBeInTheDocument();
  });

  it('renders without action when not provided', () => {
    const { container } = render(
      <EmptyState icon="📋" title="Empty" message="None" />
    );
    expect(container.querySelector('button')).toBeNull();
  });
});

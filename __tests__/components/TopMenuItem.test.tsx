import React from 'react';
import { render, screen } from '@testing-library/react';
import TopMenuItem from '@/components/TopMenuItem';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, className }: any) => (
    <a href={href} className={className}>{children}</a>
  );
});

describe('TopMenuItem', () => {
  it('renders link with title and href', () => {
    render(<TopMenuItem title="My Bookings" pageRef="/dashboard" />);
    const link = screen.getByText('My Bookings');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('applies btn-nav class', () => {
    render(<TopMenuItem title="Book Company" pageRef="/book-company" />);
    expect(screen.getByText('Book Company')).toHaveClass('btn-nav');
  });
});

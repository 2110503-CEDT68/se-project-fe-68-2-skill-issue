import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthLeftPanel from '@/components/auth/AuthLeftPanel';

describe('AuthLeftPanel', () => {
  it('renders branding', () => {
    render(<AuthLeftPanel />);
    expect(screen.getByText('Online Jobfair')).toBeInTheDocument();
  });

  it('renders event info', () => {
    render(<AuthLeftPanel />);
    expect(screen.getByText('Event Registration')).toBeInTheDocument();
    expect(screen.getByText('May 10 – 13, 2022')).toBeInTheDocument();
  });

  it('renders booking limit info', () => {
    render(<AuthLeftPanel />);
    expect(screen.getByText('Up to 3 companies per person')).toBeInTheDocument();
  });
});

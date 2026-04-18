import React from 'react';
import { render, screen } from '@testing-library/react';
import Toast from '@/components/Toast';

describe('Toast', () => {
  it('renders nothing when toast is null', () => {
    const { container } = render(<Toast toast={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders toast message with success class', () => {
    render(<Toast toast={{ msg: 'Saved!', type: 'success' }} />);
    const el = screen.getByText('Saved!');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('toast');
    expect(el).toHaveClass('success');
  });

  it('renders toast message with error class', () => {
    render(<Toast toast={{ msg: 'Failed!', type: 'error' }} />);
    const el = screen.getByText('Failed!');
    expect(el).toHaveClass('error');
  });
});

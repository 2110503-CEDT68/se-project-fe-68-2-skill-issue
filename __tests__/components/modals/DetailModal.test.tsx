import React from 'react';
import { render, screen } from '@testing-library/react';
import DetailModal from '@/components/modals/DetailModal';

describe('DetailModal', () => {
  const mockBooking = {
    _id: 'b1',
    bookingDate: '2022-05-10T09:00:00',
    company: {
      _id: 'c1',
      name: 'Test Corp',
      address: '123 Main St',
      description: 'A test company',
      telephone_number: '012-345-6789',
      website: 'https://test.com',
    },
  } as any;

  it('renders company name', () => {
    render(<DetailModal target={mockBooking} onClose={() => {}} />);
    expect(screen.getByText('Test Corp')).toBeInTheDocument();
  });

  it('renders company address', () => {
    render(<DetailModal target={mockBooking} onClose={() => {}} />);
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('renders company description', () => {
    render(<DetailModal target={mockBooking} onClose={() => {}} />);
    expect(screen.getByText('A test company')).toBeInTheDocument();
  });

  it('renders phone number', () => {
    render(<DetailModal target={mockBooking} onClose={() => {}} />);
    expect(screen.getByText('012-345-6789')).toBeInTheDocument();
  });

  it('renders formatted booking date', () => {
    render(<DetailModal target={mockBooking} onClose={() => {}} />);
    expect(screen.getByText('10 May 2022, 09:00')).toBeInTheDocument();
  });

  it('renders website link', () => {
    render(<DetailModal target={mockBooking} onClose={() => {}} />);
    const link = screen.getByText('https://test.com');
    expect(link).toHaveAttribute('href', 'https://test.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders Close button', () => {
    render(<DetailModal target={mockBooking} onClose={() => {}} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('handles company without website', () => {
    const noWebsite = { ...mockBooking, company: { ...mockBooking.company, website: '' } };
    render(<DetailModal target={noWebsite} onClose={() => {}} />);
    expect(screen.queryByText('Website')).not.toBeInTheDocument();
  });
});

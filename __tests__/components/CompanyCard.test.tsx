import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompanyCard from '@/components/CompanyCard';

jest.mock('next/link', () => {
  return ({ children, href, className }: any) => (
    <a href={href} className={className}>{children}</a>
  );
});

describe('CompanyCard', () => {
  const company = { _id: 'c1', name: 'TestCo', address: '123 St', description: 'A company' } as any;
  const booking = { _id: 'b1', bookingDate: '2022-05-10T09:00:00', company } as any;

  it('renders company name and address', () => {
    render(<CompanyCard company={company} isFull={false} index={0} onBook={() => {}} onEdit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('TestCo')).toBeInTheDocument();
    expect(screen.getByText('123 St')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<CompanyCard company={company} isFull={false} index={0} onBook={() => {}} onEdit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('A company')).toBeInTheDocument();
  });

  it('renders "Book Now" when not booked and not full', () => {
    render(<CompanyCard company={company} isFull={false} index={0} onBook={() => {}} onEdit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Book Now')).toBeInTheDocument();
  });

  it('calls onBook when "Book Now" clicked', () => {
    const onBook = jest.fn();
    render(<CompanyCard company={company} isFull={false} index={0} onBook={onBook} onEdit={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('Book Now'));
    expect(onBook).toHaveBeenCalledWith(company);
  });

  it('shows "Booking limit reached" when full and not booked', () => {
    render(<CompanyCard company={company} isFull={true} index={0} onBook={() => {}} onEdit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Booking limit reached')).toBeInTheDocument();
  });

  it('shows booked state with edit/cancel buttons', () => {
    render(<CompanyCard company={company} booked={booking} isFull={false} index={0} onBook={() => {}} onEdit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('✏️ Edit')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onEdit when edit clicked', () => {
    const onEdit = jest.fn();
    render(<CompanyCard company={company} booked={booking} isFull={false} index={0} onBook={() => {}} onEdit={onEdit} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('✏️ Edit'));
    expect(onEdit).toHaveBeenCalledWith(company);
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = jest.fn();
    render(<CompanyCard company={company} booked={booking} isFull={false} index={0} onBook={() => {}} onEdit={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledWith(booking);
  });

  it('truncates long descriptions', () => {
    const longDesc = { ...company, description: 'A'.repeat(200) };
    render(<CompanyCard company={longDesc} isFull={false} index={0} onBook={() => {}} onEdit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('A'.repeat(110) + '...')).toBeInTheDocument();
  });

  it('links to company profile', () => {
    render(<CompanyCard company={company} isFull={false} index={0} onBook={() => {}} onEdit={() => {}} onCancel={() => {}} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/company/c1');
  });
});

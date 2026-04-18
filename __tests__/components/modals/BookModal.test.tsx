import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BookModal from '@/components/modals/BookModal';

describe('BookModal', () => {
  const company = { _id: 'c1', name: 'BookCo', address: '456 Ave', website: 'book.com', telephone_number: '999' } as any;

  const defaultProps = {
    company,
    editMode: false,
    date: '2022-05-10',
    time: '09:00',
    submitting: false,
    onDateChange: jest.fn(),
    onTimeChange: jest.fn(),
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders "Confirm Booking" in book mode', () => {
    render(<BookModal {...defaultProps} />);
    const matches = screen.getAllByText('Confirm Booking');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Edit Booking Date" in edit mode', () => {
    render(<BookModal {...defaultProps} editMode={true} />);
    expect(screen.getByText('Edit Booking Date')).toBeInTheDocument();
  });

  it('shows company details in book mode', () => {
    render(<BookModal {...defaultProps} />);
    expect(screen.getByText('BookCo')).toBeInTheDocument();
    expect(screen.getByText('456 Ave')).toBeInTheDocument();
    expect(screen.getByText('book.com')).toBeInTheDocument();
    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('hides company detail section in edit mode', () => {
    render(<BookModal {...defaultProps} editMode={true} />);
    expect(screen.queryByText('456 Ave')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<BookModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Booking' }));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('shows "Booking..." when submitting in book mode', () => {
    render(<BookModal {...defaultProps} submitting={true} />);
    expect(screen.getByText('Booking...')).toBeInTheDocument();
  });

  it('shows "Saving…" when submitting in edit mode', () => {
    render(<BookModal {...defaultProps} editMode={true} submitting={true} />);
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });
});

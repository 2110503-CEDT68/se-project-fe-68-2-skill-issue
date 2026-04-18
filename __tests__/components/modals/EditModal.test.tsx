import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditModal from '@/components/modals/EditModal';

describe('EditModal', () => {
  const mockBooking = {
    _id: 'b1',
    bookingDate: '2022-05-10T09:00:00',
    company: { _id: 'c1', name: 'Edit Corp' },
  } as any;

  const defaultProps = {
    target: mockBooking,
    date: '2022-05-10',
    time: '09:00',
    loading: false,
    onDateChange: jest.fn(),
    onTimeChange: jest.fn(),
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders heading', () => {
    render(<EditModal {...defaultProps} />);
    expect(screen.getByText('Edit Booking Date')).toBeInTheDocument();
  });

  it('renders company name', () => {
    render(<EditModal {...defaultProps} />);
    expect(screen.getByText('Edit Corp')).toBeInTheDocument();
  });

  it('calls onConfirm when Save clicked', () => {
    render(<EditModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when Cancel clicked', () => {
    render(<EditModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows "Saving…" when loading', () => {
    render(<EditModal {...defaultProps} loading={true} />);
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('disables confirm when loading', () => {
    render(<EditModal {...defaultProps} loading={true} />);
    expect(screen.getByText('Saving…')).toBeDisabled();
  });
});

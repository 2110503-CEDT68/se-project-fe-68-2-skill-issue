import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CancelModal from '@/components/modals/CancelModal';

describe('CancelModal', () => {
  const mockBooking = {
    _id: 'b1',
    bookingDate: '2022-05-10T09:00:00',
    company: { _id: 'c1', name: 'Test Company' },
  } as any;

  it('renders company name in confirmation message', () => {
    render(<CancelModal target={mockBooking} loading={false} onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Test Company')).toBeInTheDocument();
  });

  it('renders "Cancel Booking?" heading', () => {
    render(<CancelModal target={mockBooking} loading={false} onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Cancel Booking?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = jest.fn();
    render(<CancelModal target={mockBooking} loading={false} onConfirm={onConfirm} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Yes, Cancel It'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when "Keep It" button clicked', () => {
    const onClose = jest.fn();
    render(<CancelModal target={mockBooking} loading={false} onConfirm={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByText('Keep It'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading text when loading', () => {
    render(<CancelModal target={mockBooking} loading={true} onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Cancelling…')).toBeInTheDocument();
  });

  it('disables confirm button when loading', () => {
    render(<CancelModal target={mockBooking} loading={true} onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Cancelling…')).toBeDisabled();
  });
});

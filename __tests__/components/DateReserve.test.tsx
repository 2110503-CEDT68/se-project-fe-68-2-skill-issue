import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DateReserve from '@/components/DateReserve';

describe('DateReserve', () => {
  const defaultProps = {
    date: '2022-05-10',
    time: '09:00',
    onDateChange: jest.fn(),
    onTimeChange: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders date input with correct value', () => {
    render(<DateReserve {...defaultProps} />);
    const dateInput = screen.getByDisplayValue('2022-05-10');
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('type', 'date');
  });

  it('renders time select with correct value', () => {
    render(<DateReserve {...defaultProps} />);
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
  });

  it('calls onDateChange when date changes', () => {
    render(<DateReserve {...defaultProps} />);
    fireEvent.change(screen.getByDisplayValue('2022-05-10'), { target: { value: '2022-05-11' } });
    expect(defaultProps.onDateChange).toHaveBeenCalledWith('2022-05-11');
  });

  it('calls onTimeChange when time changes', () => {
    render(<DateReserve {...defaultProps} />);
    fireEvent.change(screen.getByDisplayValue('09:00'), { target: { value: '10:00' } });
    expect(defaultProps.onTimeChange).toHaveBeenCalledWith('10:00');
  });

  it('renders time options from timeOptions utility', () => {
    render(<DateReserve {...defaultProps} />);
    expect(screen.getByText('09:30')).toBeInTheDocument();
    expect(screen.getByText('17:00')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Banner from '@/components/layout/Banner';

describe('Banner', () => {
  it('renders the banner heading', () => {
    render(<Banner />);
    expect(screen.getByText('Online Jobfair 2022')).toBeInTheDocument();
  });

  it('renders event dates', () => {
    render(<Banner />);
    expect(screen.getByText('May 10 – 13, 2022')).toBeInTheDocument();
  });

  it('renders online format info', () => {
    render(<Banner />);
    expect(screen.getByText('Online Format')).toBeInTheDocument();
  });
});

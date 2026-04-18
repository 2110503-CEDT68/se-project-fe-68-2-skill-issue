import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalWrapper from '@/components/ModalWrapper';

describe('ModalWrapper', () => {
  it('renders children', () => {
    render(
      <ModalWrapper open={true} onClose={() => {}}>
        <p>Modal Content</p>
      </ModalWrapper>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('adds "open" class when open is true', () => {
    const { container } = render(
      <ModalWrapper open={true} onClose={() => {}}>
        <p>Test</p>
      </ModalWrapper>
    );
    expect(container.firstChild).toHaveClass('open');
  });

  it('does not add "open" class when open is false', () => {
    const { container } = render(
      <ModalWrapper open={false} onClose={() => {}}>
        <p>Test</p>
      </ModalWrapper>
    );
    expect(container.firstChild).not.toHaveClass('open');
  });

  it('calls onClose when clicking overlay', () => {
    const handleClose = jest.fn();
    const { container } = render(
      <ModalWrapper open={true} onClose={handleClose}>
        <p>Test</p>
      </ModalWrapper>
    );
    // Click the overlay (first child)
    fireEvent.click(container.firstChild!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking modal content', () => {
    const handleClose = jest.fn();
    render(
      <ModalWrapper open={true} onClose={handleClose}>
        <p>Test</p>
      </ModalWrapper>
    );
    fireEvent.click(screen.getByText('Test'));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ModalWrapper open={true} onClose={() => {}} className="custom-modal">
        <p>Test</p>
      </ModalWrapper>
    );
    const modal = container.querySelector('.modal');
    expect(modal).toHaveClass('custom-modal');
  });
});

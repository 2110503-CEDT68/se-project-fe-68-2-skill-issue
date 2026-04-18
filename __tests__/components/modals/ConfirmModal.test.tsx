import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '@/components/modals/ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    open: true,
    title: 'Delete Item?',
    message: 'This action cannot be undone.',
    confirmText: 'Delete',
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders title and message', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('renders default icon', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('🗑️')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<ConfirmModal {...defaultProps} icon="⚠️" />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows loading text when loading', () => {
    render(<ConfirmModal {...defaultProps} loading={true} loadingText="Deleting..." />);
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('disables confirm button when loading', () => {
    render(<ConfirmModal {...defaultProps} loading={true} />);
    expect(screen.getByText('Processing…')).toBeDisabled();
  });

  it('uses custom cancel text', () => {
    render(<ConfirmModal {...defaultProps} cancelText="Go Back" />);
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });
});

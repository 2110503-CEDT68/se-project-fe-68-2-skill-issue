import React from 'react';
import { render, screen } from '@testing-library/react';
import EyeIcon from '@/components/EyeIcon';

describe('EyeIcon', () => {
  it('renders SVG element when show=false', () => {
    const { container } = render(<EyeIcon show={false} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // When not showing (eye open), has circle element
    expect(container.querySelector('circle')).toBeInTheDocument();
  });

  it('renders SVG with line when show=true (eye closed)', () => {
    const { container } = render(<EyeIcon show={true} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // When show=true (hide icon), has a strikethrough line
    expect(container.querySelector('line')).toBeInTheDocument();
  });
});

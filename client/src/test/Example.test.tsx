import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Example } from '../components/Example';

describe('Example Component', () => {
  it('renders correctly', () => {
    render(<Example />);
    expect(screen.getByText('Hello Vitest')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

test('renders badge with default variant', () => {
  render(<Badge>Test</Badge>);
  const badge = screen.getByText('Test');
  expect(badge).toBeInTheDocument();
  // default variant should include primary background class
  expect(badge).toHaveClass('bg-primary');
});

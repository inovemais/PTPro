import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Title from './index';

// Primeiro teste - snapshot test com condições mínimas
it('should render correctly with minimal props', () => {
  const { container } = render(<Title text="Hello World" />);
  expect(container).toMatchSnapshot();
});

// Segundo teste - dentro de um describe para dar contexto
describe('when highlighted prop is true', () => {
  it('should render h1 with title-highlighted class', () => {
    render(<Title text="Highlighted Title" highlighted={true} />);
    const titleElement = screen.getByTestId('title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('title-highlighted');
    expect(titleElement.tagName).toBe('H1');
  });
});


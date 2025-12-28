import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './index';

// Primeiro teste - snapshot test com condições mínimas
it('should render correctly with minimal props', () => {
  const { container } = render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
  expect(container).toMatchSnapshot();
});

// Segundo teste - dentro de um describe para dar contexto
describe('when Header is rendered', () => {
  it('should render navbar with logo, brand and navigation links', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    const logo = screen.getByAltText('Logo');
    const brand = screen.getByText('PWD');
    const loginLink = screen.getByText('Login');
    const registerLink = screen.getByText('Register');
    
    expect(logo).toBeInTheDocument();
    expect(brand).toBeInTheDocument();
    expect(loginLink).toBeInTheDocument();
    expect(registerLink).toBeInTheDocument();
  });
});


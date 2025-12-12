import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../../../components/HomePage';

// Mock do fetch para evitar chamadas reais à API durante os testes
global.fetch = vi.fn();

describe('HomePage Integration Test', () => {
  beforeEach(() => {
    // Limpar mocks antes de cada teste
    vi.clearAllMocks();
  });

  it('should render HomePage with both LoginForms', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Verificar que ambos os títulos dos LoginForms são renderizados
    const adminTitle = screen.getByText('Admin');
    const userTitle = screen.getByText('User');

    expect(adminTitle).toBeInTheDocument();
    expect(userTitle).toBeInTheDocument();
  });

  it('should render both login forms with their input fields', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Verificar que os campos de input de ambos os formulários são renderizados
    // Como há dois LoginForms, haverá múltiplos campos com os mesmos labels
    const nameInputs = screen.getAllByLabelText(/name/i);
    const passwordInputs = screen.getAllByLabelText(/password/i);

    // Verificar que os campos existem
    expect(nameInputs.length).toBeGreaterThanOrEqual(1);
    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
    
    // Verificar que cada campo está no documento e é um input
    nameInputs.forEach(input => {
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });
    passwordInputs.forEach(input => {
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  it('should render login mode buttons for both forms', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Verificar que os botões de modo de login aparecem (há dois formulários, então múltiplos botões)
    const usernamePasswordButtons = screen.getAllByText('Username/Password');
    const qrCodeButtons = screen.getAllByText('QR Code Login');

    // Deve haver pelo menos 2 de cada (um para cada formulário)
    expect(usernamePasswordButtons.length).toBeGreaterThanOrEqual(2);
    expect(qrCodeButtons.length).toBeGreaterThanOrEqual(2);
  });
});


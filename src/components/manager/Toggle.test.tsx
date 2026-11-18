import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Toggle from './Toggle';

describe('Toggle', () => {
  it('mostra o estado e avisa o novo valor ao clicar', async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} label="Ativar banner" onChange={onChange} />);
    const botao = screen.getByRole('switch', { name: 'Ativar banner' });
    expect(botao).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(botao);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('desligado fica vermelho e ligado fica azul', () => {
    const { rerender } = render(<Toggle checked={false} label="x" onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveClass('bg-[#e30613]');
    rerender(<Toggle checked label="x" onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveClass('bg-[#4757f0]');
  });
});

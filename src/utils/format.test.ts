import { describe, expect, it } from 'vitest';
import { formatCep, formatDias, formatPhone } from './format';
import { formatCnpj, isValidCnpj } from './cnpj';

describe('formatDias', () => {
  it('usa singular para 1 dia e plural nos demais', () => {
    expect(formatDias(1)).toBe('1 dia');
    expect(formatDias(2)).toBe('2 dias');
    expect(formatDias(10)).toBe('10 dias');
  });
});

describe('formatPhone e formatCep', () => {
  it('aplica a máscara do telefone com DDD', () => {
    expect(formatPhone('19999990000')).toBe('(19) 99999-0000');
  });
  it('devolve vazio para telefone ausente', () => {
    expect(formatPhone(null)).toBe('');
  });
  it('aplica a máscara do CEP', () => {
    expect(formatCep('13560000')).toBe('13560-000');
  });
});

describe('CNPJ', () => {
  it('aceita um CNPJ válido e recusa um inválido', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11222333000182')).toBe(false);
    expect(isValidCnpj('')).toBe(false);
  });
  it('aplica a máscara', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
});

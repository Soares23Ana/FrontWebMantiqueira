import { describe, expect, it } from 'vitest';
import { caminhoInternoSeguro } from './safeRedirect';

describe('caminhoInternoSeguro', () => {
  it('aceita caminhos internos, com query e hash', () => {
    expect(caminhoInternoSeguro('/minha-conta', '/x')).toBe('/minha-conta');
    expect(caminhoInternoSeguro('/catalogo?marca=3#topo', '/x')).toBe('/catalogo?marca=3#topo');
    expect(caminhoInternoSeguro('/', '/x')).toBe('/');
  });

  it('rejeita "//" (protocolo relativo), barra invertida e protocolos', () => {
    for (const ruim of ['//evil.com', '///evil.com', String.raw`/\evil.com`, String.raw`\\evil.com`, 'https://evil.com', 'http://evil.com/x', 'javascript:alert(1)', 'evil.com', 'minha-conta', '']) {
      expect(caminhoInternoSeguro(ruim, '/padrao')).toBe('/padrao');
    }
  });

  it('rejeita caracteres de controle (tab/quebra de linha viram "//" no navegador)', () => {
    expect(caminhoInternoSeguro('/\t/evil.com', '/padrao')).toBe('/padrao');
    expect(caminhoInternoSeguro('/\n/evil.com', '/padrao')).toBe('/padrao');
  });

  it('rejeita o que não é texto', () => {
    expect(caminhoInternoSeguro(undefined, '/padrao')).toBe('/padrao');
    expect(caminhoInternoSeguro(null, '/padrao')).toBe('/padrao');
    expect(caminhoInternoSeguro({ a: 1 }, '/padrao')).toBe('/padrao');
  });

  it('sem padrão, devolve undefined quando inseguro', () => {
    expect(caminhoInternoSeguro('//evil.com')).toBeUndefined();
    expect(caminhoInternoSeguro('/ok')).toBe('/ok');
  });
});

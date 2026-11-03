// CNPJ alfanumérico (Receita Federal, desde julho de 2026): as 12 primeiras posições aceitam letras ou números
// e os 2 dígitos verificadores continuam numéricos. O CNPJ só com números segue válido.

/** Maiúsculas, só [0-9A-Z], no máximo 14 caracteres: "12.abc.345/01de-35" vira "12ABC34501DE35". */
export const normalizarCnpj = (value: string): string => value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);

/** Máscara 00.000.000/0000-00 que aceita letras nas 12 primeiras posições (os 2 últimos só aceitam números). */
export function formatCnpj(value: string): string {
  const n = normalizarCnpj(value);
  const c = n.slice(0, 12) + n.slice(12).replace(/\D/g, '');
  return c.replace(/^(.{2})(.{1,3})?(.{1,3})?(.{1,4})?(\d{1,2})?$/, (_, a, b, c2, d, e) =>
    [a, b && `.${b}`, c2 && `.${c2}`, d && `/${d}`, e && `-${e}`].filter(Boolean).join(''));
}

/** Formato (12 caracteres + 2 dígitos) e dígitos verificadores por módulo 11, com cada caractere valendo ASCII − 48. */
export function isValidCnpj(value: string): boolean {
  const d = normalizarCnpj(value);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(d) || /^(.)\1{13}$/.test(d)) return false;
  const digit = (n: number): number => {
    let sum = 0;
    let weight = n - 7;
    for (let i = 0; i < n; i++) {
      sum += (d.charCodeAt(i) - 48) * weight--;
      if (weight < 2) weight = 9;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return digit(12) === Number(d[12]) && digit(13) === Number(d[13]);
}

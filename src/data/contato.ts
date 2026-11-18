// Contatos padrão da empresa: valem quando o campo correspondente está vazio no CMS.
// Usados pelo rodapé da loja e pela tela de Contatos do gestor, para nunca divergirem.
export const CONTATO_PADRAO = {
  telefone: '(19) 3638-1010',
  whatsapp: '(19) 99672-7161',
  email: 'ecommerce@dmantiqueira.com.br',
  horario: 'Seg a sex, das 7h45 às 18h00',
} as const;

/** "5519996727161" → "19996727161" (sem o DDI 55, para exibir). */
export const whatsappNumber = (digits: string) => (digits.startsWith('55') ? digits.slice(2) : digits);

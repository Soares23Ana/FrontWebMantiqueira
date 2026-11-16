// Logos da Mantiqueira. A horizontal vai nos cabeçalhos e no rodapé; a vertical, nas telas de entrar e criar conta.
// No modo noturno a página troca para a versão com fundo transparente e cores claras (sem o quadro branco).
// "sempreClaro" mantém a versão original, para quando a logo fica sobre um fundo claro (como no quadro branco do rodapé).
export default function Logo({ variante = 'horizontal', className = '', sempreClaro = false }: {
  variante?: 'horizontal' | 'vertical'; className?: string; sempreClaro?: boolean;
}) {
  const claro = variante === 'horizontal' ? '/logo-horizontal.webp' : '/logo-vertical.png';
  const escuro = variante === 'horizontal' ? '/logo-horizontal-escuro.png' : '/logo-vertical-escuro.png';
  return (
    <>
      <img src={claro} alt="Mantiqueira Distribuidora" className={`w-auto max-w-none ${sempreClaro ? '' : 'dark:hidden'} ${className}`} />
      {!sempreClaro && <img src={escuro} alt="" aria-hidden="true" className={`hidden w-auto max-w-none dark:block ${className}`} />}
    </>
  );
}

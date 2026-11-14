// Logos da Mantiqueira. A horizontal vai nos cabeçalhos e no rodapé; a vertical, nas telas de entrar e criar conta.
// Elas têm fundo claro, então no modo noturno ganham um quadro branco (classe "logo-quadro" do index.css).
export default function Logo({ variante = 'horizontal', className = '' }: { variante?: 'horizontal' | 'vertical'; className?: string }) {
  const src = variante === 'horizontal' ? '/logo-horizontal.webp' : '/logo-vertical.png';
  return <img src={src} alt="Mantiqueira Distribuidora" className={`logo-quadro w-auto ${className}`} />;
}

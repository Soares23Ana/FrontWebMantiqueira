const PASSO = 0.035; // atraso entre letras (s), a partir do centro da palavra

// Efeito "rolar": ao passar o mouse, cada letra sobe e é substituída pela mesma letra vinda de baixo.
// Só CSS (sem biblioteca). Inspirado em Skiper UI. O elemento pai precisa ter a classe "group/roll".
function Letras({ palavra, entrando }: { palavra: string; entrando: boolean }) {
  const n = palavra.length;
  return (
    <>
      {palavra.split('').map((l, i) => (
        <span key={i} style={{ transitionDelay: `${PASSO * Math.abs(i - (n - 1) / 2)}s` }}
          className={`inline-block transition-transform duration-300 ease-in-out motion-reduce:transition-none ${entrando
            ? 'translate-y-full group-hover/roll:translate-y-0'
            : 'group-hover/roll:-translate-y-full'}`}>{l}</span>
      ))}
    </>
  );
}

export default function TextRoll({ children }: { children: string }) {
  // palavras (o hífen fica no fim da anterior, então "Colgate-Palmolive" ainda quebra de linha no celular) e espaços
  const pedacos = children.match(/[^ -]+-?| /g) ?? [];
  return (
    <span aria-label={children}>
      {pedacos.map((palavra, i) => palavra === ' ' ? ' ' : (
        <span key={i} aria-hidden="true" className="relative -mb-[0.12em] inline-block overflow-hidden whitespace-nowrap pb-[0.12em] align-top">
          {/* o respiro embaixo evita cortar letras com perna (g, q, p) */}
          <span className="block"><Letras palavra={palavra} entrando={false} /></span>
          <span className="absolute inset-0 block"><Letras palavra={palavra} entrando /></span>
        </span>
      ))}
    </span>
  );
}

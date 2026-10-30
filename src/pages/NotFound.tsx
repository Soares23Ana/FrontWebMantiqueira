import { Link } from 'react-router-dom';

export default function NotFound({ title = 'Página não encontrada', text = 'O endereço pode ter mudado ou não existe mais.' }: { title?: string; text?: string }) {
  return (
    <section className="mx-auto max-w-xl px-5 py-24 text-center">
      <h2 className="text-3xl font-extrabold">{title}</h2>
      <p className="mt-3 text-muted">{text}</p>
      <Link to="/" className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-extrabold text-white">Voltar ao início</Link>
    </section>
  );
}

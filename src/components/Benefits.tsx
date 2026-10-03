interface Benefit {
  title: string;
  text: string;
}

const benefits: Benefit[] = [
  { title: 'Frete grátis em SP', text: 'Para todo o estado de São Paulo.' },
  { title: 'Pedidos a partir de R$ 265,00', text: 'Pensado para o varejo que compra em quantidade.' },
  { title: '+ de 2.000 itens', text: 'Higiene, farmácia, bebê, limpeza e bazar em estoque.' },
];

export default function Benefits() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-3">
      {benefits.map((b) => (
        <div key={b.title}>
          <div className="mb-4 h-1.5 w-12 rounded bg-accent" />
          <h3 className="mb-1 text-xl font-extrabold">{b.title}</h3>
          <p className="text-muted">{b.text}</p>
        </div>
      ))}
    </section>
  );
}

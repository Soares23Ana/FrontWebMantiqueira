export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-brand to-brand-dark px-5 py-20 text-white md:py-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-7xl">
          Higiene, farmácia e bebê num só pedido.
        </h1>
        <p className="mt-5 max-w-xl text-lg opacity-90">
          Mais de 2.000 itens em estoque. Frete grátis para todo o estado de São Paulo em pedidos a partir de R$ 265,00.
        </p>
        <a href="#produtos" className="mt-8 inline-block rounded-full bg-accent px-8 py-4 font-extrabold transition hover:brightness-110">
          Ver ofertas
        </a>
      </div>
    </section>
  );
}

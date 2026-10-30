import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

// Evita a "tela branca": se algo quebrar, mostra uma mensagem e um link para voltar.
export default class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center">
        <h2 className="text-3xl font-extrabold">Algo deu errado</h2>
        <p className="mt-3 text-muted">Não foi possível carregar esta página.</p>
        <a href="/" className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-extrabold text-white">
          Voltar ao início
        </a>
      </section>
    );
  }
}

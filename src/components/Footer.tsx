import { useStore } from '../context/StoreContext';
import { formatPhone } from '../utils/format';
import Logo from './Logo';
import { whatsappNumber } from './WhatsAppButton';

// Contatos vêm das configurações públicas do CMS; enquanto não carregam (ou se estiverem vazios) usamos os padrões.
export default function Footer() {
  const { config } = useStore();
  const telefone = config?.telefone_contato ? formatPhone(config.telefone_contato) : '(19) 3638-1010';
  const whats = config?.whatsapp ? formatPhone(whatsappNumber(config.whatsapp)) : '(19) 99672-7161';
  const email = config?.email_contato ?? 'ecommerce@dmantiqueira.com.br';
  const horario = config?.horario_atendimento ?? 'Seg a sex, das 7h45 às 18h00';
  return (
    <footer className="bg-brand px-5 py-12 text-center text-sm text-white">
      <Logo className="mx-auto mb-4 h-14 rounded-xl bg-white px-2 py-1" />
      <p className="text-base font-extrabold">Mantiqueira Distribuidora</p>
      <p className="mt-2 opacity-85">Telefone: {telefone} · WhatsApp: {whats}</p>
      <p className="opacity-85">{email} · {horario}</p>
      <p className="mt-2 opacity-85">© 2026 Mantiqueira Distribuidora de Produtos de Higiene LTDA</p>
    </footer>
  );
}

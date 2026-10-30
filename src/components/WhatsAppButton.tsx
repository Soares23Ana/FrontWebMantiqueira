import { useStore } from '../context/StoreContext';

/** "5519996727161" → "19996727161" (sem o DDI 55, para exibir). */
export const whatsappNumber = (digits: string) => (digits.startsWith('55') ? digits.slice(2) : digits);

// Botão flutuante de WhatsApp; só aparece se o número estiver configurado no CMS.
export default function WhatsAppButton() {
  const { config } = useStore();
  if (!config?.whatsapp) return null;
  const text = encodeURIComponent('Olá! Vim pelo site da Mantiqueira e gostaria de atendimento.');
  return (
    <a href={`https://wa.me/${config.whatsapp}?text=${text}`} target="_blank" rel="noopener noreferrer"
      aria-label="Falar no WhatsApp" title="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-xl transition hover:scale-105">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 000-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z" />
      </svg>
    </a>
  );
}

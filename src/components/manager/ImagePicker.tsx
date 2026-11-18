import type { ChangeEvent } from 'react';

export const MAX_IMAGE_MB = 5;
export const ACCEPTED_IMAGES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/** Mensagem de erro para um arquivo que não serve (vazio = ok). Mesmos formatos e limite de antes. */
export function validarImagem(f: File): string {
  if (!ACCEPTED_IMAGES.includes(f.type)) return 'Use uma imagem PNG, JPG, WEBP ou GIF.';
  if (f.size > MAX_IMAGE_MB * 1024 * 1024) return `A imagem deve ter até ${MAX_IMAGE_MB} MB.`;
  return '';
}

interface Props {
  /** Nome acessível do <input type="file"> (que continua sendo o controle nativo). */
  ariaLabel: string;
  fileName?: string;
  onPick: (file: File) => void;
}

// Seletor de imagem estilizado: botão "Escolher imagem" bem visível e o nome do arquivo escolhido.
// O input nativo continua no DOM (só escondido da vista), então teclado e leitor de tela funcionam normalmente.
export default function ImagePicker({ ariaLabel, fileName, onPick }: Props) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onPick(f);
  };
  return (
    <label className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-dashed border-black/20 p-3">
      <input type="file" accept={ACCEPTED_IMAGES.join(',')} onChange={onChange} aria-label={ariaLabel} className="peer sr-only" />
      <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-brand px-5 text-sm font-extrabold text-white transition hover:bg-brand-dark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
        Escolher imagem
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{fileName || 'Nenhum arquivo escolhido'}</span>
    </label>
  );
}

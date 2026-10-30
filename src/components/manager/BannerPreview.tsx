interface Props {
  title: string;
  image: string;
  className?: string;
}

// Mostra a imagem enviada ou, se não houver, um fundo com as cores da marca.
export default function BannerPreview({ title, image, className = '' }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-dark to-brand ${className}`}>
      {image && <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover" />}
      {!image && (
        <span className="absolute inset-0 flex items-center px-4 text-sm font-extrabold leading-tight text-white sm:text-base">{title}</span>
      )}
    </div>
  );
}

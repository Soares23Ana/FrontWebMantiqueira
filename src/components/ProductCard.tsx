import React from 'react';

interface ProductCardProps {
  name: string;
  category: string;
  pricePerUnit: number;
  packPrice: number;
  packQuantity: number;
  imageUrl: string;
  badge?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  category,
  pricePerUnit,
  packPrice,
  packQuantity,
  imageUrl,
  badge,
}) => {
  return (
    <div className="bg-surface rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between p-4">
      {/* Imagem + Badge */}
      <div className="relative w-full h-48 bg-white flex items-center justify-center mb-3">
        {badge && (
          <span className="absolute top-2 left-2 bg-accent text-white text-xs font-heading font-bold px-2 py-1 rounded">
            {badge}
          </span>
        )}
        <img src={imageUrl} alt={name} className="max-h-full object-contain" />
      </div>

      {/* Categoria e Nome */}
      <div>
        <p className="text-xs text-textSecondary uppercase font-medium">{category}</p>
        <h3 className="font-heading font-bold text-textPrimary text-base line-clamp-2 mt-1 mb-2">
          {name}
        </h3>
      </div>

      {/* Preços e Ação */}
      <div className="mt-auto">
        <p className="text-xs text-textMuted">
          R$ {pricePerUnit.toFixed(2)} / un (Cx c/ {packQuantity})
        </p>
        <p className="font-heading text-xl font-bold text-brand mt-1">
          R$ {packPrice.toFixed(2)}
        </p>

        {/* Botão de Ação */}
        <button className="w-full mt-3 bg-accent hover:bg-accent-hover text-white font-heading font-bold py-2 px-4 rounded transition-colors uppercase text-sm tracking-wide">
          Adicionar ao Pedido
        </button>
      </div>
    </div>
  );
};
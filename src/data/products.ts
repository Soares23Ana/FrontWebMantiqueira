import type { CategoryOption, Product } from '../types';

// Dados simulados: no futuro virão da API.
export const categories: CategoryOption[] = ['Todos', 'Higiene e beleza', 'Farmácia', 'Loja do bebê'];

export const products: Product[] = [
  { id: 1, name: 'Loção hidratante Paixão Flor de Baunilha 200 ml', category: 'Higiene e beleza', image: '/img/paixao.webp' },
  { id: 2, name: 'Tenys Pé Baruel pó antisséptico 100 g', category: 'Higiene e beleza', image: '/img/tenys.webp' },
  { id: 3, name: 'Esmalte Risqué Renda 8 ml', category: 'Higiene e beleza', image: '/img/risque.webp' },
  { id: 4, name: 'Sabonete Phebo 90 g Frescor da Manhã', category: 'Higiene e beleza', image: '/img/phebo.webp' },
  { id: 5, name: 'Aparelho de barbear Bic Comfort 3 c/ 2', category: 'Higiene e beleza', image: '/img/bic.webp' },
  { id: 6, name: 'Sabonete de glicerina Granado Bebê 250 ml', category: 'Loja do bebê', image: '/img/granado.webp' },
  { id: 7, name: 'Fralda Huggies Máxima Proteção G c/ 20', category: 'Loja do bebê', image: '/img/huggies.webp' },
  { id: 8, name: 'Maracugina PI 20 comprimidos', category: 'Farmácia', image: '/img/maracugina.webp' },
  { id: 9, name: 'Água boricada 3% Farmax 100 ml', category: 'Farmácia', image: '/img/aguaboricada.webp' },
    { id: 10, name: 'Absorvente interno Intimus Discreto Super c/ 8', category: 'Higiene e beleza', image: '/img/absorventeinterno.png' },
  { id: 11, name: 'Esmalte Risqué Melissa 8 ml', category: 'Higiene e beleza', image: '/img/risquemelissa.png' },
  { id: 12, name: 'Sabonete Palmolive Naturals Nutrição Intensiva 85 g c/ 3', category: 'Higiene e beleza', image: '/img/palmolive.png' },
  { id: 13, name: 'Lenço Kleenex Dia a Dia Leve 60 Pague 50', category: 'Higiene e beleza', image: '/img/kleenex.png' },
  { id: 14, name: 'Preservativo Olla Sensitive Leve 8 Pague 6', category: 'Higiene e beleza', image: '/img/ollasensitive.png' },
];

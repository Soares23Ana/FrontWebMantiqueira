export type Category = 'Higiene e beleza' | 'Farmácia' | 'Loja do bebê';
export type CategoryOption = Category | 'Todos';
export type Page = 'home' | 'favoritos' | 'carrinho' | 'login' | 'gestor';

export interface Product {
  id: number;
  name: string;
  category: Category;
  image: string;
}

export interface CartItem {
  productId: number;
  quantity: number;
}

export type OrderStatus = 'Pendente' | 'Separando' | 'Enviado' | 'Entregue';

export interface Order {
  id: number;
  customer: string;
  items: number;
  date: string;
  status: OrderStatus;
}
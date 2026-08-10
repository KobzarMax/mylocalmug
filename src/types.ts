export type UserRole = 'client' | 'business';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
};

export type CoffeeShop = {
  id: string;
  name: string;
  description: string;
  address: string;
  distance: string;
  category: string;
  rating: number;
  reviewCount: number;
  image: string;
  menu: MenuItem[];
};

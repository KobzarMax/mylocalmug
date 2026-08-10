import { CoffeeShop } from '../types';

export const coffeeShops: CoffeeShop[] = [
  {
    id: 'willow-bean',
    name: 'Willow & Bean',
    description: 'A cosy neighbourhood coffee house serving carefully sourced beans, seasonal plates, and cakes baked just down the road.',
    address: '18 Redchurch Street',
    distance: '0.3 mi',
    category: 'Speciality coffee',
    rating: 4.9,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80',
    menu: [
      { id: 'flat-white', name: 'Flat White', description: 'Double espresso, silky milk', price: 3.6, rating: 4.9, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=300&q=80' },
      { id: 'lemon-cake', name: 'Lemon & Poppy Cake', description: 'Baked locally, served warm', price: 4.25, rating: 4.8, image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=300&q=80' },
      { id: 'cold-brew', name: 'Orange Cold Brew', description: 'Single origin, orange tonic', price: 4.5, rating: 4.7, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=300&q=80' },
    ],
  },
  {
    id: 'north-star',
    name: 'North Star Coffee',
    description: 'Independent roastery, community hub, and home to seriously good espresso.',
    address: '42 Curtain Road',
    distance: '0.6 mi',
    category: 'Roastery',
    rating: 4.8,
    reviewCount: 94,
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1000&q=80',
    menu: [
      { id: 'espresso', name: 'House Espresso', description: 'Chocolate, plum, caramel', price: 2.8, rating: 4.8, image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=300&q=80' },
    ],
  },
  {
    id: 'paper-cup',
    name: 'Paper Cup',
    description: 'Bright coffee, generous brunch, and a sunny corner for the neighbourhood.',
    address: '9 Calvert Avenue',
    distance: '0.8 mi',
    category: 'Coffee & brunch',
    rating: 4.7,
    reviewCount: 71,
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1000&q=80',
    menu: [
      { id: 'brunch', name: 'Mug Brunch Deal', description: 'Toast, eggs, coffee', price: 11.5, rating: 4.6, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=300&q=80' },
    ],
  },
];

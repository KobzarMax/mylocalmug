import { ProfileImageMime } from '../../lib/profileValidation';

export type MenuCategory = {
  id: string;
  businessId: string;
  name: string;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string;
  price: number;
  photoUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
};

export type MenuData = {
  categories: MenuCategory[];
  items: MenuItem[];
};

export type MenuPhoto = {
  uri: string;
  mimeType: ProfileImageMime;
};

export type CategoryDirection = 'up' | 'down';

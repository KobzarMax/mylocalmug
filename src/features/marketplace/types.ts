import { MenuCategoryIconKey } from '../../lib/menuCategoryIcons';

export type MarketplaceCursor = { name: string; id: string };

export type PublicBusinessSummary = {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  logoUrl: string | null;
  headerUrl: string | null;
  rating: number | null;
  reviewCount: number;
};

export type PublicBusinessHour = {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type PublicBusinessDetail = PublicBusinessSummary & {
  phone: string;
  websiteUrl: string;
  socialLinks: Record<string, string>;
  timezone: string;
  hours: PublicBusinessHour[];
};

export type PublicMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  photoUrl: string | null;
  event: {
    id: string;
    title: string;
    badge: string;
    message: string;
    availableFrom: string;
    availableUntil: string;
  } | null;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
  iconKey: MenuCategoryIconKey;
  items: PublicMenuItem[];
};

export type PublicMenu = { categories: PublicMenuCategory[] };
export type PublicBusinessPage = { items: PublicBusinessSummary[]; nextCursor: MarketplaceCursor | null };

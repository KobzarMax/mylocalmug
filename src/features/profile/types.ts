import { ProfileImageMime } from '../../lib/profileValidation';
import { UserRole } from '../../types';

export type EditableProfile = {
  id: string;
  role: UserRole;
  display_name: string;
  description: string;
  avatar_path: string | null;
};

export type CoffeeSpot = {
  id: string;
  name: string;
  address: string;
  logo_url: string | null;
};

export type SelectedProfileImage = { uri: string; mimeType: ProfileImageMime };
export type ProfileNotice = { tone: 'success' | 'error' | 'info'; message: string };

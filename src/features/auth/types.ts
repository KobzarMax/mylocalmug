import { UserRole } from '../../types';

export type AuthMode = 'login' | 'register';

export type RegistrationResult = {
  requiresEmailConfirmation: boolean;
};

export type AccountProfile = {
  id: string;
  role: UserRole;
  display_name: string;
  description: string;
  avatar_path: string | null;
};

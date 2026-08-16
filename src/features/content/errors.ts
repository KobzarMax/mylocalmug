import { safeErrorMessage } from '../../lib/errors';

export function messageFrom(caught: unknown, fallback: string) {
  return safeErrorMessage(caught, fallback);
}

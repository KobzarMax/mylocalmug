export type AppErrorCode = 'network' | 'validation' | 'permission' | 'conflict' | 'unknown';

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: AppErrorCode = 'unknown',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) return error;
  const source = error instanceof Error ? error.message.toLowerCase() : '';
  if (source.includes('network') || source.includes('fetch')) {
    return new AppError('Connect to the internet and try again.', 'network');
  }
  if (source.includes('permission') || source.includes('not allowed')) {
    return new AppError('You do not have permission to make this change.', 'permission');
  }
  if (source.includes('conflict') || source.includes('revision')) {
    return new AppError('This information changed elsewhere. Reload and try again.', 'conflict');
  }
  return new AppError(fallback);
}

export function safeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AppError) return error.message;
  const message = error instanceof Error ? error.message.trim() : '';
  if (!message) return fallback;
  if (
    /permission denied|violates .*constraint|sqlstate|pgrst|relation ["']|column ["']|function public\.|database error|stack trace|jwt/i.test(
      message,
    )
  )
    return fallback;
  return message;
}

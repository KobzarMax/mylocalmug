export function messageFrom(caught: unknown, fallback: string) {
  if (caught && typeof caught === 'object' && 'message' in caught && typeof caught.message === 'string') {
    return caught.message.replace(/^.*?: /, '') || fallback;
  }
  return fallback;
}

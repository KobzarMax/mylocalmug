import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/app';

export const trpc = createTRPCReact<AppRouter>();

export function createMobileTrpcClient(getAccessToken: () => Promise<string | null>) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is required before enabling tRPC in the mobile app.');
  }

  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${apiUrl.replace(/\/$/, '')}/trpc`,
        headers: async () => {
          const accessToken = await getAccessToken();
          return accessToken ? { authorization: `Bearer ${accessToken}` } : {};
        },
      }),
    ],
  });
}

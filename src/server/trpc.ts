import 'dotenv/config';
import { initTRPC, TRPCError } from '@trpc/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export type TrpcContext = {
  userId: string | null;
};

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY;

const authClient =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const createTrpcContext = async (authorizationHeader: string | null): Promise<TrpcContext> => {
  const accessToken = authorizationHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken || !authClient) return { userId: null };

  const { data, error } = await authClient.auth.getUser(accessToken);
  return { userId: error ? null : (data.user?.id ?? null) };
};

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

export const idInput = z.object({
  id: z.string().uuid(),
});

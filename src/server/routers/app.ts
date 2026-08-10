import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  businesses,
  businessFollowers,
  favoriteBusinesses,
  profiles,
} from '../../db/schema';
import {
  avatarUploadIntentInputSchema,
  favoriteBusinessInputSchema,
  profileUpdateInputSchema,
} from '../../lib/profileValidation';
import { db } from '../db';
import { protectedProcedure, publicProcedure, router } from '../trpc';

export const appRouter = router({
  health: publicProcedure.query(() => ({
    ok: true,
    service: 'local-mug-api',
  })),

  publishedBusinesses: publicProcedure.query(async () => {
    return db
      .select()
      .from(businesses)
      .where(eq(businesses.isPublished, true))
      .orderBy(desc(businesses.createdAt));
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, ctx.userId));
    return profile ?? null;
  }),

  joinBusiness: protectedProcedure
    .input(
      z.object({
        businessId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .insert(businessFollowers)
        .values({
          businessId: input.businessId,
          clientId: ctx.userId,
        })
        .onConflictDoNothing();

      return { joined: true };
    }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, ctx.userId));
      if (!profile) return null;

      const favoriteCoffeeSpots = await db
        .select({
          id: businesses.id,
          name: businesses.name,
          address: businesses.address,
          logoUrl: businesses.logoUrl,
        })
        .from(favoriteBusinesses)
        .innerJoin(businesses, eq(favoriteBusinesses.businessId, businesses.id))
        .where(eq(favoriteBusinesses.profileId, ctx.userId))
        .orderBy(asc(businesses.name));

      return { ...profile, favoriteCoffeeSpots };
    }),

    update: protectedProcedure
      .input(profileUpdateInputSchema)
      .mutation(async ({ ctx, input }) => {
        if (input.avatarPath && !input.avatarPath.startsWith(`${ctx.userId}/`)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Avatar path must belong to the current user.' });
        }

        const [profile] = await db
          .update(profiles)
          .set({
            displayName: input.displayName,
            description: input.description,
            avatarPath: input.avatarPath,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, ctx.userId))
          .returning();

        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found.' });
        }

        return profile;
      }),

    favoriteCoffeeSpots: protectedProcedure.query(async ({ ctx }) => {
      return db
        .select({
          id: businesses.id,
          name: businesses.name,
          address: businesses.address,
          logoUrl: businesses.logoUrl,
        })
        .from(favoriteBusinesses)
        .innerJoin(businesses, eq(favoriteBusinesses.businessId, businesses.id))
        .where(eq(favoriteBusinesses.profileId, ctx.userId))
        .orderBy(asc(businesses.name));
    }),

    addFavoriteCoffeeSpot: protectedProcedure
      .input(favoriteBusinessInputSchema)
      .mutation(async ({ ctx, input }) => {
        const [business] = await db
          .select({ id: businesses.id })
          .from(businesses)
          .where(and(eq(businesses.id, input.businessId), eq(businesses.isPublished, true)));

        if (!business) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Coffee shop not found.' });
        }

        await db
          .insert(favoriteBusinesses)
          .values({ profileId: ctx.userId, businessId: input.businessId })
          .onConflictDoNothing();

        return { favorite: true };
      }),

    removeFavoriteCoffeeSpot: protectedProcedure
      .input(favoriteBusinessInputSchema)
      .mutation(async ({ ctx, input }) => {
        await db
          .delete(favoriteBusinesses)
          .where(
            and(
              eq(favoriteBusinesses.profileId, ctx.userId),
              eq(favoriteBusinesses.businessId, input.businessId),
            ),
          );

        return { favorite: false };
      }),

    createAvatarUploadIntent: protectedProcedure
      .input(avatarUploadIntentInputSchema)
      .mutation(({ ctx, input }) => {
        const extension = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
        }[input.mimeType];

        return {
          bucket: 'profile-images' as const,
          path: `${ctx.userId}/avatar-${Date.now()}.${extension}`,
          contentType: input.mimeType,
          maxBytes: 5 * 1024 * 1024,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

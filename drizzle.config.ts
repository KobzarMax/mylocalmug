import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Expo automatically reads .env.local, while drizzle-kit does not. Load the
// ignored local file first, then fall back to .env for CI/deployment setups.
config({ path: '.env.local' });
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Add it to .env.local before running database commands.');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});

ALTER TABLE "social_oauth_states" ADD COLUMN "candidate_ciphertext" text;--> statement-breakpoint
ALTER TABLE "social_oauth_states" ADD COLUMN "candidate_nonce" text;
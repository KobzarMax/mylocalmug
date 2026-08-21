CREATE OR REPLACE FUNCTION public.brand_color_luminance(value text)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = public
AS $$
DECLARE
  red double precision;
  green double precision;
  blue double precision;
BEGIN
  IF value !~ '^#[0-9A-F]{6}$' THEN RETURN NULL; END IF;
  red := get_byte(decode(substr(value, 2), 'hex'), 0) / 255.0;
  green := get_byte(decode(substr(value, 2), 'hex'), 1) / 255.0;
  blue := get_byte(decode(substr(value, 2), 'hex'), 2) / 255.0;
  red := CASE WHEN red <= 0.04045 THEN red / 12.92 ELSE power((red + 0.055) / 1.055, 2.4) END;
  green := CASE WHEN green <= 0.04045 THEN green / 12.92 ELSE power((green + 0.055) / 1.055, 2.4) END;
  blue := CASE WHEN blue <= 0.04045 THEN blue / 12.92 ELSE power((blue + 0.055) / 1.055, 2.4) END;
  RETURN 0.2126 * red + 0.7152 * green + 0.0722 * blue;
END;
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.brand_color_contrast(first_color text, second_color text)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public
AS $$
  SELECT (greatest(public.brand_color_luminance(first_color), public.brand_color_luminance(second_color)) + 0.05)
    / (least(public.brand_color_luminance(first_color), public.brand_color_luminance(second_color)) + 0.05)
$$;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "brand_primary_color" text DEFAULT '#235C4B' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "brand_accent_color" text DEFAULT '#D06E38' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "brand_background_color" text DEFAULT '#F7F2EA' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_brand_colors_check" CHECK ("businesses"."brand_primary_color" ~ '^#[0-9A-F]{6}$' and "businesses"."brand_accent_color" ~ '^#[0-9A-F]{6}$' and "businesses"."brand_background_color" ~ '^#[0-9A-F]{6}$');--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_brand_contrast_check" CHECK (public.brand_color_contrast("businesses"."brand_primary_color", "businesses"."brand_background_color") >= 3 and public.brand_color_contrast("businesses"."brand_accent_color", "businesses"."brand_background_color") >= 3);

ALTER TABLE "menu_categories" ADD COLUMN "icon_key" text DEFAULT 'other' NOT NULL;--> statement-breakpoint
UPDATE "menu_categories"
SET "icon_key" = CASE
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(coffee|espresso)' THEN 'coffee'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(tea|hot drink)' THEN 'tea'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(cold drink|soft drink|juice|smoothie)' THEN 'cold_drink'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(beer|wine|cocktail|alcohol)' THEN 'alcoholic_drink'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(breakfast|brunch)' THEN 'breakfast'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(sandwich|toastie|panini|wrap|burger)' THEN 'sandwich'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(bakery|pastr|croissant|baked)' THEN 'bakery'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(cake|dessert|sweet|treat)' THEN 'dessert'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(pizza)' THEN 'pizza'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(healthy|fruit|salad)' THEN 'healthy'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(ice cream|gelato)' THEN 'ice_cream'
  WHEN lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g')) ~ '(food|meal|lunch|dinner)' THEN 'meal'
  ELSE 'other'
END;--> statement-breakpoint
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_icon_key_check" CHECK ("menu_categories"."icon_key" in ('coffee','tea','cold_drink','alcoholic_drink','breakfast','sandwich','bakery','dessert','meal','pizza','healthy','ice_cream','other'));

UPDATE "menu_categories"
SET "name" = regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g');

WITH ranked AS (
  SELECT
    "id",
    first_value("id") OVER (
      PARTITION BY "business_id", lower("name")
      ORDER BY "sort_order", "id"
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY "business_id", lower("name")
      ORDER BY "sort_order", "id"
    ) AS duplicate_number
  FROM "menu_categories"
)
UPDATE "menu_items" item
SET "category_id" = ranked.canonical_id
FROM ranked
WHERE item."category_id" = ranked."id"
  AND ranked.duplicate_number > 1;

WITH ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "business_id", lower("name")
      ORDER BY "sort_order", "id"
    ) AS duplicate_number
  FROM "menu_categories"
)
DELETE FROM "menu_categories" category
USING ranked
WHERE category."id" = ranked."id"
  AND ranked.duplicate_number > 1;

WITH ordered AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "business_id"
      ORDER BY "sort_order", "name", "id"
    ) - 1 AS next_sort_order
  FROM "menu_categories"
)
UPDATE "menu_categories" category
SET "sort_order" = ordered.next_sort_order
FROM ordered
WHERE category."id" = ordered."id";

CREATE UNIQUE INDEX "menu_categories_business_normalized_name_unique"
ON "menu_categories" USING btree (
  "business_id",
  lower(regexp_replace(btrim("name"), '[[:space:]]+', ' ', 'g'))
);

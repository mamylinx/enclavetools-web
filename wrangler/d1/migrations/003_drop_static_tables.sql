-- 003_drop_static_tables.sql
-- Drop all tables that are no longer needed — data now lives in static JSON files under src/data/.
-- Only pending_tools remains for runtime user submissions and admin review.

DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS site_content;
DROP TABLE IF EXISTS marketing_cards;
DROP TABLE IF EXISTS filter_options;
DROP TABLE IF EXISTS category_meta;
DROP TABLE IF EXISTS legal_pages;
DROP TABLE IF EXISTS complements;
DROP TABLE IF EXISTS compare_rows;

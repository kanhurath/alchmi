-- ============================================================
-- Migration: add journey_btn_text and journey_pdf_url to home_about
-- Local:  mysql -u root vkulkarni-react < migrations/alter_home_about_add_journey_fields.sql
-- Live:   mysql -u root vk_portal_db    < migrations/alter_home_about_add_journey_fields.sql
-- Or open phpMyAdmin, select the correct database, and run the ALTER TABLE below.
-- ============================================================

USE `vkulkarni-react`;   -- change to vk_portal_db for live server

ALTER TABLE home_about
  ADD COLUMN IF NOT EXISTS media_url        VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS journey_btn_text VARCHAR(200) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS journey_pdf_url  VARCHAR(500) NOT NULL DEFAULT '';

-- Set the default button label for any existing row
UPDATE home_about SET journey_btn_text = 'Explore Vinay''s Journey' WHERE journey_btn_text = '';

ALTER TABLE bio_engage_venues
  ADD COLUMN venue_url     VARCHAR(500) DEFAULT NULL  AFTER venue_text,
  ADD COLUMN venue_new_tab TINYINT(1)   NOT NULL DEFAULT 0 AFTER venue_url;

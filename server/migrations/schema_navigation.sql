-- ============================================================
-- Navigation CMS schema
-- Run: mysql -u root vk_portal_db < migrations/schema_navigation.sql
-- ============================================================

USE `vk_portal_db`;

CREATE TABLE IF NOT EXISTS nav_items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  menu        ENUM('header','footer') NOT NULL DEFAULT 'header',
  label       VARCHAR(200) NOT NULL DEFAULT '',
  url         VARCHAR(500) NOT NULL DEFAULT '',
  is_external TINYINT(1)  NOT NULL DEFAULT 0,
  parent_id   INT UNSIGNED DEFAULT NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_nav_parent FOREIGN KEY (parent_id)
    REFERENCES nav_items (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

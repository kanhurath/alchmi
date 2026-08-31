/**
 * Run pending schema migrations.
 * Usage: node migrate.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrations = [
  {
    name: 'add venue_url to bio_engage_venues',
    check: `SELECT COUNT(*) AS cnt
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'bio_engage_venues'
              AND COLUMN_NAME  = 'venue_url'`,
    sql: `ALTER TABLE bio_engage_venues
            ADD COLUMN venue_url VARCHAR(500) DEFAULT NULL AFTER venue_text`,
  },
  {
    name: 'add venue_new_tab to bio_engage_venues',
    check: `SELECT COUNT(*) AS cnt
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'bio_engage_venues'
              AND COLUMN_NAME  = 'venue_new_tab'`,
    sql: `ALTER TABLE bio_engage_venues
            ADD COLUMN venue_new_tab TINYINT(1) NOT NULL DEFAULT 0 AFTER venue_url`,
  },
  {
    name: 'create site_page_blocks table',
    check: `SELECT COUNT(*) AS cnt
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'site_page_blocks'`,
    sql: `CREATE TABLE site_page_blocks (
            id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            page_slug   VARCHAR(100) NOT NULL,
            block_type  VARCHAR(80)  NOT NULL,
            content     LONGTEXT     NOT NULL,
            sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_slug_order (page_slug, sort_order)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: 'create page_seo table',
    check: `SELECT COUNT(*) AS cnt
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'page_seo'`,
    sql: `CREATE TABLE page_seo (
            page_slug        VARCHAR(100) NOT NULL PRIMARY KEY,
            seo_title        VARCHAR(200) DEFAULT NULL,
            meta_description TEXT         DEFAULT NULL,
            focus_keyword    VARCHAR(200) DEFAULT NULL,
            canonical_url    VARCHAR(500) DEFAULT NULL,
            og_image_url     VARCHAR(500) DEFAULT NULL,
            custom_schema    LONGTEXT     DEFAULT NULL,
            updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: 'add SEO columns to custom_pages (seo_title)',
    check: `SELECT COUNT(*) AS cnt
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'custom_pages'
              AND COLUMN_NAME  = 'seo_title'`,
    sql: `ALTER TABLE custom_pages
            ADD COLUMN seo_title      VARCHAR(200) DEFAULT NULL AFTER meta_description,
            ADD COLUMN focus_keyword  VARCHAR(200) DEFAULT NULL AFTER seo_title,
            ADD COLUMN canonical_url  VARCHAR(500) DEFAULT NULL AFTER focus_keyword,
            ADD COLUMN og_image_url   VARCHAR(500) DEFAULT NULL AFTER canonical_url,
            ADD COLUMN custom_schema  LONGTEXT     DEFAULT NULL AFTER og_image_url`,
  },
  {
    name: 'create page_section_layout table',
    check: `SELECT COUNT(*) AS cnt
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME   = 'page_section_layout'`,
    sql: `CREATE TABLE page_section_layout (
            id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            page_slug    VARCHAR(100) NOT NULL,
            section_key  VARCHAR(100) NOT NULL,
            sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            enabled      TINYINT(1) NOT NULL DEFAULT 1,
            UNIQUE KEY uk_page_section (page_slug, section_key),
            INDEX idx_page_order (page_slug, sort_order)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
];

(async () => {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASS     || '',
    database: process.env.DB_NAME     || 'vkulkarni-react',
    charset:  'utf8mb4',
  });

  try {
    for (const m of migrations) {
      const [[{ cnt }]] = await db.query(m.check);
      if (cnt > 0) {
        console.log(`  SKIP  ${m.name} (column already exists)`);
      } else {
        await db.query(m.sql);
        console.log(`  DONE  ${m.name}`);
      }
    }
    console.log('\nAll migrations complete.');
  } finally {
    await db.end();
  }
})();

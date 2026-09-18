-- Customer profiles table
CREATE TABLE IF NOT EXISTS customers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(50)  UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  profile_photo   VARCHAR(500),
  company_name    VARCHAR(255),
  gst_number      VARCHAR(50),
  organization_type VARCHAR(100),
  office_number   VARCHAR(50),
  address         TEXT,
  num_employees   INT,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customer password reset tokens
CREATE TABLE IF NOT EXISTS customer_password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  used        TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

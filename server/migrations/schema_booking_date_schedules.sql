-- Per-date custom time slot schedules
CREATE TABLE IF NOT EXISTS booking_date_schedules (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  schedule_date DATE         NOT NULL UNIQUE,
  note          VARCHAR(255),
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_date_schedule_slots (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT          NOT NULL,
  slot_label  VARCHAR(20)  NOT NULL,
  sort_order  INT          DEFAULT 0,
  FOREIGN KEY (schedule_id) REFERENCES booking_date_schedules(id) ON DELETE CASCADE
);

CREATE DATABASE IF NOT EXISTS cinemahub_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS cinemahub_shadow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'cinemahub_user'@'localhost'
  IDENTIFIED BY 'MatKhauApp';

ALTER USER 'cinemahub_user'@'localhost'
  IDENTIFIED BY 'MatKhauApp';

GRANT ALL PRIVILEGES ON cinemahub_db.* TO 'cinemahub_user'@'localhost';
GRANT ALL PRIVILEGES ON cinemahub_shadow.* TO 'cinemahub_user'@'localhost';

FLUSH PRIVILEGES;
php -r 'echo password_hash("StrongPass123", PASSWORD_DEFAULT), PHP_EOL;'
INSERT INTO users(account_id, login, pass_hash)
VALUES (1, 'admin', '$2y$10$....');
<?php
declare(strict_types=1);
require __DIR__ . '/init.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('POST required', 405);

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$account_id = isset($body['account_id']) ? (int)$body['account_id'] : 0;
$login      = trim((string)($body['login'] ?? ''));
$password   = (string)($body['password'] ?? '');

if ($account_id <= 0) json_err('account_id is required');
if ($login === '' || $password === '') json_err('login and password are required');

$pdo = db($CONF);

$user = db_one($pdo, "
    SELECT id, account_id, login, pass_hash, is_active
    FROM users
    WHERE account_id = :acc AND login = :login
", [':acc' => $account_id, ':login' => $login]);

if (!$user || !$user['is_active']) json_err('Invalid credentials', 401);
if (!password_verify($password, $user['pass_hash'])) json_err('Invalid credentials', 401);

$token = bin2hex(random_bytes(32));
$ttl   = (int)($CONF['security']['token_ttl_seconds'] ?? 86400);

db_exec($pdo, "
    INSERT INTO sessions(token, user_id, account_id, expires_at, last_ip, user_agent)
    VALUES (:t, :uid, :acc, now() + (:ttl || ' seconds')::interval, :ip, :ua)
", [
    ':t'   => $token,
    ':uid' => (int)$user['id'],
    ':acc' => (int)$user['account_id'],
    ':ttl' => $ttl,
    ':ip'  => $_SERVER['REMOTE_ADDR'] ?? null,
    ':ua'  => $_SERVER['HTTP_USER_AGENT'] ?? null,
]);

json_ok([
    'token' => $token,
    'expires_in' => $ttl,
    'account_id' => (int)$user['account_id'],
    'login' => $user['login'],
]);

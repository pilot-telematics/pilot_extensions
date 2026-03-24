<?php
declare(strict_types=1);

$CONF = require __DIR__ . '/conf.php';
require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

if (!empty($CONF['cors']['allow_origin'])) {
    header('Access-Control-Allow-Origin: ' . $CONF['cors']['allow_origin']);
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_ok(array $data = []): void {
    echo json_encode(['success' => true] + $data, JSON_UNESCAPED_UNICODE);
    exit;
}
function json_err(string $message, int $code = 400, array $extra = []): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message] + $extra, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_bearer_token(): ?string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('~^Bearer\s+(.+)$~i', $h, $m)) return trim($m[1]);
    return null;
}

/** Returns ['account_id'=>..., 'user_id'=>..., 'login'=>...] */
function require_session(array $CONF): array
{
    $token = get_bearer_token();
    if (!$token) json_err('Missing Authorization Bearer token', 401);

    $pdo = db($CONF);
    $ttl = (int)($CONF['security']['token_ttl_seconds'] ?? 86400);

    $row = db_one($pdo, "
        SELECT s.account_id, s.user_id, u.login
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = :t
          AND s.expires_at > now()
          AND u.is_active = true
    ", [':t' => $token]);

    if (!$row) json_err('Invalid or expired session', 401);

    db_exec($pdo, "
        UPDATE sessions
        SET expires_at = now() + (:ttl || ' seconds')::interval
        WHERE token = :t
    ", [
        ':t' => $token,
        ':ttl' => $ttl
    ]);

    return $row;
}

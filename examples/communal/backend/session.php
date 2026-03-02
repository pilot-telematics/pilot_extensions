<?php
declare(strict_types=1);
require __DIR__ . '/init.php';

$op = $_GET['op'] ?? '';

if ($op === 'check') {
    $s = require_session($CONF); // will 401 if invalid/expired
    json_ok([
        'account_id' => (int)$s['account_id'],
        'user_id' => (int)$s['user_id'],
        'login' => (string)$s['login'],
    ]);
}

if ($op === 'logout') {
    $token = get_bearer_token();
    if ($token) {
        $pdo = db($CONF);
        db_exec($pdo, "DELETE FROM sessions WHERE token = :t", [':t' => $token]);
    }
    json_ok();
}

json_err('Unknown op', 400);

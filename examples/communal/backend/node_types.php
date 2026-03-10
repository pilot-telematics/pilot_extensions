<?php
declare(strict_types=1);
require __DIR__ . '/init.php';

$session = require_session($CONF);
$pdo = db($CONF);

$rows = db_all($pdo, "
    SELECT code AS id, code, name, icon_cls
    FROM node_types
    WHERE is_active = true
    ORDER BY sort_order ASC, name ASC
");

json_ok([
    'data' => $rows
]);
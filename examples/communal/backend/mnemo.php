<?php
declare(strict_types=1);

require __DIR__ . '/init.php';

$session = require_session($CONF);
$acc = (int)$session['account_id'];
$pdo = db($CONF);

$op = $_GET['op'] ?? '';

function get_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $j = json_decode($raw, true);
    return is_array($j) ? $j : [];
}

function get_node(PDO $pdo, int $acc, int $nodeId): ?array {
    return db_one($pdo, "
        SELECT id
        FROM tree_nodes
        WHERE id = :id
          AND account_id = :acc
    ", [
        ':id' => $nodeId,
        ':acc' => $acc
    ]);
}

function get_empty_schema(int $nodeId): array {
    return [
        'node_id' => $nodeId,
        'canvas' => [
            'width' => 1200,
            'height' => 800
        ],
        'elements' => []
    ];
}

function normalize_schema(array $schema, int $nodeId): array {
    $schema['node_id'] = $nodeId;
    $schema['canvas'] = is_array($schema['canvas'] ?? null) ? $schema['canvas'] : [
        'width' => 1200,
        'height' => 800
    ];
    $schema['elements'] = is_array($schema['elements'] ?? null) ? $schema['elements'] : [];

    return $schema;
}

if ($op === 'read') {
    $nodeId = (int)($_GET['node_id'] ?? 0);
    if ($nodeId <= 0) json_err('node_id is required', 400);

    if (!get_node($pdo, $acc, $nodeId)) {
        json_err('Node not found', 404);
    }

    $row = db_one($pdo, "
        SELECT schema_json
        FROM mnemo_schemes
        WHERE account_id = :acc
          AND node_id = :node_id
    ", [
        ':acc' => $acc,
        ':node_id' => $nodeId
    ]);

    if (!$row) {
        json_ok(['schema' => get_empty_schema($nodeId)]);
    }

    $schema = json_decode((string)$row['schema_json'], true);
    if (!is_array($schema)) {
        $schema = get_empty_schema($nodeId);
    }

    json_ok(['schema' => normalize_schema($schema, $nodeId)]);
}

if ($op === 'save') {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_err('POST required', 405);

    $body = get_json_body();
    $nodeId = (int)($body['node_id'] ?? 0);
    $schema = is_array($body['schema'] ?? null) ? $body['schema'] : null;

    if ($nodeId <= 0) json_err('node_id is required', 400);
    if ($schema === null) json_err('schema is required', 400);

    if (!get_node($pdo, $acc, $nodeId)) {
        json_err('Node not found', 404);
    }

    $schema = normalize_schema($schema, $nodeId);

    db_exec($pdo, "
        INSERT INTO mnemo_schemes (account_id, node_id, schema_json)
        VALUES (:acc, :node_id, CAST(:schema_json AS jsonb))
        ON CONFLICT (account_id, node_id)
        DO UPDATE SET
            schema_json = EXCLUDED.schema_json,
            updated_at = now()
    ", [
        ':acc' => $acc,
        ':node_id' => $nodeId,
        ':schema_json' => json_encode($schema, JSON_UNESCAPED_UNICODE)
    ]);

    json_ok(['schema' => $schema]);
}

if ($op === 'delete') {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_err('POST required', 405);

    $body = get_json_body();
    $nodeId = (int)($body['node_id'] ?? 0);
    if ($nodeId <= 0) json_err('node_id is required', 400);

    db_exec($pdo, "
        DELETE FROM mnemo_schemes
        WHERE account_id = :acc
          AND node_id = :node_id
    ", [
        ':acc' => $acc,
        ':node_id' => $nodeId
    ]);

    json_ok(['node_id' => $nodeId]);
}

json_err('Unknown op', 400);

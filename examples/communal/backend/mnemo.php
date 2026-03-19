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

function decode_schema(?string $raw, int $nodeId): array {
    $schema = json_decode((string)$raw, true);

    if (!is_array($schema)) {
        $schema = get_empty_schema($nodeId);
    }

    return normalize_schema($schema, $nodeId);
}

function normalize_schema_record(array $row, int $nodeId, int $index = 1): array {
    $name = trim((string)($row['name'] ?? ''));

    return [
        'id' => isset($row['id']) ? (int)$row['id'] : null,
        'name' => $name !== '' ? $name : ('Schema ' . $index),
        'schema' => decode_schema((string)($row['schema_json'] ?? ''), $nodeId)
    ];
}

function list_schema_records(PDO $pdo, int $acc, int $nodeId): array {
    $rows = db_all($pdo, "
        SELECT id, name, schema_json
        FROM mnemo_schemes
        WHERE account_id = :acc
          AND node_id = :node_id
        ORDER BY created_at, id
    ", [
        ':acc' => $acc,
        ':node_id' => $nodeId
    ]);

    return array_map(
        fn(array $row, int $index): array => normalize_schema_record($row, $nodeId, $index + 1),
        $rows,
        array_keys($rows)
    );
}

function get_schema_record(PDO $pdo, int $acc, int $nodeId, int $schemaId): ?array {
    $row = db_one($pdo, "
        SELECT id, name, schema_json
        FROM mnemo_schemes
        WHERE account_id = :acc
          AND node_id = :node_id
          AND id = :id
    ", [
        ':acc' => $acc,
        ':node_id' => $nodeId,
        ':id' => $schemaId
    ]);

    return $row ? normalize_schema_record($row, $nodeId) : null;
}

function get_first_schema_record(PDO $pdo, int $acc, int $nodeId): ?array {
    $row = db_one($pdo, "
        SELECT id, name, schema_json
        FROM mnemo_schemes
        WHERE account_id = :acc
          AND node_id = :node_id
        ORDER BY created_at, id
        LIMIT 1
    ", [
        ':acc' => $acc,
        ':node_id' => $nodeId
    ]);

    return $row ? normalize_schema_record($row, $nodeId) : null;
}

function schema_name_exists(PDO $pdo, int $acc, int $nodeId, string $name, ?int $ignoreId = null): bool {
    $sql = "
        SELECT 1
        FROM mnemo_schemes
        WHERE account_id = :acc
          AND node_id = :node_id
          AND name = :name
    ";
    $params = [
        ':acc' => $acc,
        ':node_id' => $nodeId,
        ':name' => $name
    ];

    if ($ignoreId !== null) {
        $sql .= " AND id <> :id";
        $params[':id'] = $ignoreId;
    }

    return db_one($pdo, $sql . " LIMIT 1", $params) !== null;
}

function get_next_schema_name(PDO $pdo, int $acc, int $nodeId): string {
    $rows = db_all($pdo, "
        SELECT name
        FROM mnemo_schemes
        WHERE account_id = :acc
          AND node_id = :node_id
    ", [
        ':acc' => $acc,
        ':node_id' => $nodeId
    ]);

    $used = [];

    foreach ($rows as $row) {
        $name = trim((string)($row['name'] ?? ''));
        if (preg_match('/^Schema\s+(\d+)$/i', $name, $match)) {
            $used[(int)$match[1]] = true;
        }
    }

    $next = 1;
    while (isset($used[$next])) {
        $next++;
    }

    return 'Schema ' . $next;
}

if ($op === 'list') {
    $nodeId = (int)($_GET['node_id'] ?? 0);
    if ($nodeId <= 0) json_err('node_id is required', 400);

    if (!get_node($pdo, $acc, $nodeId)) {
        json_err('Node not found', 404);
    }

    json_ok(['schemas' => list_schema_records($pdo, $acc, $nodeId)]);
}

if ($op === 'read') {
    $nodeId = (int)($_GET['node_id'] ?? 0);
    $schemaId = (int)($_GET['schema_id'] ?? 0);
    if ($nodeId <= 0) json_err('node_id is required', 400);

    if (!get_node($pdo, $acc, $nodeId)) {
        json_err('Node not found', 404);
    }

    $record = $schemaId > 0
        ? get_schema_record($pdo, $acc, $nodeId, $schemaId)
        : get_first_schema_record($pdo, $acc, $nodeId);

    if (!$record) {
        json_ok([
            'schema_id' => null,
            'name' => '',
            'schema' => get_empty_schema($nodeId)
        ]);
    }

    json_ok([
        'schema_id' => $record['id'],
        'name' => $record['name'],
        'schema' => $record['schema']
    ]);
}

if ($op === 'save') {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_err('POST required', 405);

    $body = get_json_body();
    $nodeId = (int)($body['node_id'] ?? 0);
    $schemaId = (int)($body['schema_id'] ?? 0);
    $name = trim((string)($body['name'] ?? ''));
    $schema = is_array($body['schema'] ?? null) ? $body['schema'] : null;

    if ($nodeId <= 0) json_err('node_id is required', 400);
    if ($schema === null) json_err('schema is required', 400);

    if (!get_node($pdo, $acc, $nodeId)) {
        json_err('Node not found', 404);
    }

    $schema = normalize_schema($schema, $nodeId);
    if ($schemaId > 0) {
        $existing = db_one($pdo, "
            SELECT id, name
            FROM mnemo_schemes
            WHERE account_id = :acc
              AND node_id = :node_id
              AND id = :id
        ", [
            ':acc' => $acc,
            ':node_id' => $nodeId,
            ':id' => $schemaId
        ]);

        if (!$existing) {
            json_err('Schema not found', 404);
        }

        if ($name === '') {
            $name = trim((string)$existing['name']);
        }

        if (schema_name_exists($pdo, $acc, $nodeId, $name, $schemaId)) {
            json_err('Schema name already exists', 409);
        }

        db_exec($pdo, "
            UPDATE mnemo_schemes
            SET name = :name,
                schema_json = CAST(:schema_json AS jsonb),
                updated_at = now()
            WHERE account_id = :acc
              AND node_id = :node_id
              AND id = :id
        ", [
            ':acc' => $acc,
            ':node_id' => $nodeId,
            ':id' => $schemaId,
            ':name' => $name,
            ':schema_json' => json_encode($schema, JSON_UNESCAPED_UNICODE)
        ]);
    } else {
        if ($name === '') {
            $name = get_next_schema_name($pdo, $acc, $nodeId);
        }

        if (schema_name_exists($pdo, $acc, $nodeId, $name)) {
            json_err('Schema name already exists', 409);
        }

        $row = db_one($pdo, "
            INSERT INTO mnemo_schemes (account_id, node_id, name, schema_json)
            VALUES (:acc, :node_id, :name, CAST(:schema_json AS jsonb))
            RETURNING id
        ", [
            ':acc' => $acc,
            ':node_id' => $nodeId,
            ':name' => $name,
            ':schema_json' => json_encode($schema, JSON_UNESCAPED_UNICODE)
        ]);

        $schemaId = (int)($row['id'] ?? 0);
    }

    $saved = get_schema_record($pdo, $acc, $nodeId, $schemaId);
    json_ok(['record' => $saved]);
}

if ($op === 'delete') {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_err('POST required', 405);

    $body = get_json_body();
    $nodeId = (int)($body['node_id'] ?? 0);
    $schemaId = (int)($body['schema_id'] ?? 0);
    if ($nodeId <= 0) json_err('node_id is required', 400);
    if ($schemaId <= 0) json_err('schema_id is required', 400);

    db_exec($pdo, "
        DELETE FROM mnemo_schemes
        WHERE account_id = :acc
          AND node_id = :node_id
          AND id = :id
    ", [
        ':acc' => $acc,
        ':node_id' => $nodeId,
        ':id' => $schemaId
    ]);

    json_ok([
        'node_id' => $nodeId,
        'schema_id' => $schemaId
    ]);
}

json_err('Unknown op', 400);

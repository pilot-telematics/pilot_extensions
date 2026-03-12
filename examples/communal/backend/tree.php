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

/**
 * Ext writer sends {"data":{...}} or {"data":[{...}]}
 */
function get_record_from_body(): array {
    $body = get_json_body();
    $d = $body['data'] ?? [];
    if (is_array($d) && array_is_list($d)) return $d[0] ?? [];
    return is_array($d) ? $d : [];
}

function ensure_parent(PDO $pdo, int $acc, ?int $parent_id): void {
    if ($parent_id === null) return;
    $p = db_one($pdo, "SELECT id FROM tree_nodes WHERE id=:id AND account_id=:acc", [
        ':id' => $parent_id,
        ':acc' => $acc,
    ]);
    if (!$p) json_err('Invalid parent_id', 400);
}

function node_children_count(PDO $pdo, int $acc, int $id): int {
    $r = db_one($pdo, "SELECT count(*) AS c FROM tree_nodes WHERE account_id=:acc AND parent_id=:id", [
        ':acc' => $acc,
        ':id' => $id
    ]);
    return (int)($r['c'] ?? 0);
}

function node_recursive_children_count(PDO $pdo, int $acc, int $id): int {
    $row = db_one($pdo, "
        WITH RECURSIVE subtree AS (
            SELECT id
            FROM tree_nodes
            WHERE account_id = :acc AND parent_id = :id
            UNION ALL
            SELECT child.id
            FROM tree_nodes child
            JOIN subtree s ON s.id = child.parent_id
            WHERE child.account_id = :acc
        )
        SELECT count(*) AS c
        FROM subtree
    ", [
        ':acc' => $acc,
        ':id' => $id,
    ]);

    return (int)($row['c'] ?? 0);
}

function node_child_agents(PDO $pdo, int $acc, int $id): array {
    $rows = db_all($pdo, "
        WITH RECURSIVE subtree AS (
            SELECT id, agent_id
            FROM tree_nodes
            WHERE account_id = :acc AND parent_id = :id
            UNION ALL
            SELECT child.id, child.agent_id
            FROM tree_nodes child
            JOIN subtree s ON s.id = child.parent_id
            WHERE child.account_id = :acc
        )
        SELECT DISTINCT agent_id
        FROM subtree
        WHERE agent_id IS NOT NULL
        ORDER BY agent_id
    ", [
        ':acc' => $acc,
        ':id' => $id,
    ]);

    return array_map(static function (array $row): int {
        return (int)$row['agent_id'];
    }, $rows);
}

function load_node_row(PDO $pdo, int $acc, int $id): ?array {
    return db_one($pdo, "
        SELECT
            n.id,
            n.parent_id,
            n.type,
            n.name,
            n.descr,
            n.is_leaf,
            n.agent_id,
            t.icon_cls
        FROM tree_nodes n
        LEFT JOIN node_types t ON t.code = n.type
        WHERE n.id = :id
          AND n.account_id = :acc
    ", [
        ':id' => $id,
        ':acc' => $acc,
    ]);
}

function node_to_ext(PDO $pdo, int $acc, array $row): array {
    $id = (int)$row['id'];
    $isLeaf = (int)($row['is_leaf'] ?? 0);
    $directChildrenCount = node_children_count($pdo, $acc, $id);

    return [
        'id' => $id,
        'text' => $row['name'],
        'name' => $row['name'],
        'type' => $row['type'],
        'descr' => $row['descr'] ?? null,
        'is_leaf' => $isLeaf,
        'iconCls' => $row['icon_cls'] ?? null,
        'agent_id' => $row['agent_id'] === null ? null : (int)$row['agent_id'],
        'parent_id' => $row['parent_id'] === null ? null : (int)$row['parent_id'],
        // children_count now contains the full recursive descendant count.
        'children_count' => node_recursive_children_count($pdo, $acc, $id),
        // child_agents contains agent ids collected from all descendant nodes.
        'child_agents' => node_child_agents($pdo, $acc, $id),
        'leaf' => ($directChildrenCount === 0),
        'expanded' => false
    ];
}

/* ---------------- READ ---------------- */
if ($op === 'read') {
    $node = $_GET['node'] ?? 'root';
    $parent_id = null;

    if ($node !== 'root' && $node !== '' && $node !== null) {
        $parent_id = (int)$node;
    }

    $sql = "
        SELECT
            n.id,
            n.parent_id,
            n.type,
            n.name,
            n.descr,
            n.is_leaf,
            n.agent_id,
            t.icon_cls
        FROM tree_nodes n
        LEFT JOIN node_types t ON t.code = n.type
        WHERE n.account_id = :acc
          AND " . ($parent_id === null ? "n.parent_id IS NULL" : "n.parent_id = :pid") . "
        ORDER BY n.sort_order ASC, n.name ASC
    ";

    $rows = db_all($pdo, $sql, $parent_id === null
        ? [':acc' => $acc]
        : [':acc' => $acc, ':pid' => $parent_id]
    );

    $children = [];
    foreach ($rows as $r) {
        $children[] = node_to_ext($pdo, $acc, $r);
    }

    echo json_encode(['children' => $children], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------------- CREATE ---------------- */
if ($op === 'create') {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_err('POST required', 405);

    $rec = get_record_from_body();

    $parent_id_raw = $rec['parent_id'] ?? ($rec['parentId'] ?? null);
    $is_leaf = !empty($rec['is_leaf']) ? 1 : 0;
    $agent_id_raw = $rec['agent_id'] ?? null;
    $agent_id = ($agent_id_raw === null || $agent_id_raw === '' ? null : (int)$agent_id_raw);
    if ($is_leaf && !$agent_id) json_err('agent_id is required for leaf node', 400);
    if (!$is_leaf) $agent_id = null;

    // Treat the Ext JS root node as a null parent id.
    if ($parent_id_raw === 'root' || $parent_id_raw === '' || $parent_id_raw === null) {
        $parent_id = null;
    } else {
        $parent_id = (int)$parent_id_raw;
        if ($parent_id <= 0) json_err('Invalid parent_id', 400);
    }

    $type  = (string)($rec['type'] ?? '');
    $name  = trim((string)($rec['name'] ?? $rec['text'] ?? ''));
    $descr = array_key_exists('descr', $rec) ? (string)$rec['descr'] : null;

    ensure_type_exists($pdo, $type);
    if ($name === '') json_err('name is required');

    ensure_parent($pdo, $acc, $parent_id);

    $st = $pdo->prepare("
        INSERT INTO tree_nodes(account_id, parent_id, type, name, descr, is_leaf, agent_id)
        VALUES (:acc, :pid, :type, :name, :descr, :isl, :aid)
        RETURNING id
    ");
    $st->execute([
        ':acc' => $acc,
        ':pid' => $parent_id,
        ':type' => $type,
        ':name' => $name,
        ':descr' => $descr,
        ':isl' => $is_leaf,
        ':aid' => $agent_id
    ]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row || !isset($row['id'])) json_err('Insert failed', 500);

    $created = load_node_row($pdo, $acc, (int)$row['id']);
    if (!$created) json_err('Insert failed', 500);

    json_ok(['children' => [node_to_ext($pdo, $acc, $created)]]);
}

/* ---------------- UPDATE ---------------- */
if ($op === 'update') {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_err('POST required', 405);

    $rec = get_record_from_body();

    $id = (int)($rec['id'] ?? 0);
    if ($id <= 0) json_err('id is required');

    // Load the current row so partial updates keep existing values intact.
    $existing = load_node_row($pdo, $acc, $id);
    if (!$existing) json_err('Not found', 404);

    $sets = [];
    $params = [':id' => $id, ':acc' => $acc];
    $is_leaf = (int)$existing['is_leaf'];
    $agent_id = $existing['agent_id'] === null ? null : (int)$existing['agent_id'];

    if (array_key_exists('name', $rec) || array_key_exists('text', $rec)) {
        $name = trim((string)($rec['name'] ?? $rec['text'] ?? ''));
        if ($name === '') json_err('name cannot be empty');
        $sets[] = "name = :name";
        $params[':name'] = $name;
    }

    if (array_key_exists('descr', $rec)) {
        $sets[] = "descr = :descr";
        $params[':descr'] = (string)$rec['descr'];
    }

    if (array_key_exists('type', $rec)) {
        $type = (string)$rec['type'];
        ensure_type_exists($pdo, $type);
        $sets[] = "type = :type";
        $params[':type'] = $type;
    }

    if (array_key_exists('is_leaf', $rec)) {
        $is_leaf = !empty($rec['is_leaf']) ? 1 : 0;
        $sets[] = "is_leaf = :is_leaf";
        $params[':is_leaf'] = $is_leaf;
    }

    if (array_key_exists('agent_id', $rec)) {
        $agent_id = ($rec['agent_id'] === null || $rec['agent_id'] === '')
            ? null
            : (int)$rec['agent_id'];
    }

    if ($is_leaf && !$agent_id) {
        json_err('No agent_id specified', 400);
    }

    $children = node_children_count($pdo, $acc, $id);
    if ($is_leaf && $children > 0) json_err('Cannot make leaf: node has children', 400);

    $sets[] = "agent_id = :agent_id";
    $params[':agent_id'] = $is_leaf ? $agent_id : null;

    // Allow moving a node to another parent when requested by the UI.
    if (array_key_exists('parent_id', $rec) || array_key_exists('parentId', $rec)) {
        $parent_id_raw = $rec['parent_id'] ?? ($rec['parentId'] ?? null);

        if ($parent_id_raw === 'root' || $parent_id_raw === '' || $parent_id_raw === null) {
            $parent_id = null;
        } else {
            $parent_id = (int)$parent_id_raw;
            if ($parent_id <= 0) json_err('Invalid parent_id', 400);
        }
        if ($parent_id === $id) json_err('parent_id cannot be self');
        ensure_parent($pdo, $acc, $parent_id);
        $sets[] = "parent_id = :pid";
        $params[':pid'] = $parent_id;
    }

    if (!$sets) json_err('Nothing to update');

    $sql = "UPDATE tree_nodes SET " . implode(', ', $sets) . " WHERE id=:id AND account_id=:acc";
    db_exec($pdo, $sql, $params);

    $row = load_node_row($pdo, $acc, $id);
    if (!$row) json_err('Not found', 404);

    json_ok(['children' => [node_to_ext($pdo, $acc, $row)]]);
}

/* ---------------- DESTROY ---------------- */
if ($op === 'destroy') {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') json_err('POST required', 405);

    $rec = get_record_from_body();
    $id = (int)($rec['id'] ?? 0);
    if ($id <= 0) json_err('id is required');

    $row = db_one($pdo, "SELECT id FROM tree_nodes WHERE id=:id AND account_id=:acc", [':id' => $id, ':acc' => $acc]);
    if (!$row) json_err('Not found', 404);

    // Subtree delete relies on the foreign key cascade in the schema.
    db_exec($pdo, "DELETE FROM tree_nodes WHERE id=:id AND account_id=:acc", [':id' => $id, ':acc' => $acc]);

    json_ok(['data' => ['id' => $id]]);
}

json_err('Unknown op', 400);

function ensure_type_exists(PDO $pdo, string $type): void
{
    $row = db_one($pdo, "
        SELECT code
        FROM node_types
        WHERE code = :code
          AND is_active = true
    ", [':code' => $type]);

    if (!$row) {
        json_err('Invalid type', 400);
    }
}
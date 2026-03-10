-- USERS (per-extension)
CREATE TABLE IF NOT EXISTS users (
                                     id         bigserial PRIMARY KEY,
                                     account_id bigint NOT NULL,
                                     login      text NOT NULL,
                                     pass_hash  text NOT NULL,
                                     is_active  boolean NOT NULL DEFAULT true,
                                     created_at timestamptz NOT NULL DEFAULT now(),
                                     UNIQUE(account_id, login)
);

-- SESSIONS (token auth)
CREATE TABLE IF NOT EXISTS sessions (
                                        token      text PRIMARY KEY,
                                        user_id    bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                        account_id bigint NOT NULL,
                                        created_at timestamptz NOT NULL DEFAULT now(),
                                        expires_at timestamptz NOT NULL,
                                        last_ip    inet,
                                        user_agent text
);

CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions(account_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

-- TREE
CREATE TABLE IF NOT EXISTS tree_nodes (
                                          id         bigserial PRIMARY KEY,
                                          account_id bigint NOT NULL,
                                          parent_id  bigint NULL REFERENCES tree_nodes(id) ON DELETE CASCADE,
                                          type       text NOT NULL,
                                          name       text NOT NULL,
                                          descr      text NULL,
                                          sort_order integer NOT NULL DEFAULT 0,
                                          is_leaf smallint NOT NULL DEFAULT 0,
                                          agent_id bigint NULL,
                                          created_at timestamptz NOT NULL DEFAULT now(),
                                          updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tree_nodes_acc_parent_idx ON tree_nodes(account_id, parent_id);
CREATE INDEX IF NOT EXISTS tree_nodes_acc_type_idx ON tree_nodes(account_id, type);
CREATE INDEX IF NOT EXISTS tree_nodes_agent_idx ON tree_nodes(account_id, agent_id);

CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tree_nodes_updated_at ON tree_nodes;
CREATE TRIGGER trg_tree_nodes_updated_at
    BEFORE UPDATE ON tree_nodes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS node_types (
                                          id         bigserial PRIMARY KEY,
                                          code       text NOT NULL UNIQUE,
                                          name       text NOT NULL,
                                          icon_cls   text NOT NULL,
                                          is_active  boolean NOT NULL DEFAULT true,
                                          sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS node_types_active_sort_idx
    ON node_types(is_active, sort_order, name);

INSERT INTO node_types (code, name, icon_cls, sort_order)
VALUES
    ('city',   'Город',   'fa fa-city',        10),
    ('suburb', 'Район',   'fa fa-map',         20),
    ('street', 'Улица',   'fa fa-road',        30),
    ('house',  'Дом',     'fa fa-house',       40),
    ('flat',   'Квартира','fa fa-door-open',   50),
    ('well',   'Колодец', 'fa fa-circle-dot',  60),
    ('booth',  'Будка',   'fa fa-warehouse',   70)
ON CONFLICT (code) DO UPDATE
    SET
        name = EXCLUDED.name,
        icon_cls = EXCLUDED.icon_cls,
        sort_order = EXCLUDED.sort_order;
ALTER TABLE tree_nodes
    ADD CONSTRAINT tree_nodes_type_fk
        FOREIGN KEY (type) REFERENCES node_types(code);

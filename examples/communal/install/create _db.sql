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
                                          type       text NOT NULL CHECK (type IN ('city','suburb','street','house','flat')),
                                          name       text NOT NULL,
                                          descr      text NULL,
                                          sort_order integer NOT NULL DEFAULT 0,
                                          created_at timestamptz NOT NULL DEFAULT now(),
                                          updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tree_nodes_acc_parent_idx ON tree_nodes(account_id, parent_id);
CREATE INDEX IF NOT EXISTS tree_nodes_acc_type_idx ON tree_nodes(account_id, type);

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

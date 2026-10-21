CREATE TABLE inventory (
    id               BIGSERIAL PRIMARY KEY,
    product_id       BIGINT      NOT NULL UNIQUE REFERENCES products (id) ON DELETE CASCADE,
    quantity_on_hand INT         NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reserved         INT         NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    version          BIGINT      NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_inventory_reserved_lte_on_hand CHECK (reserved <= quantity_on_hand)
);

CREATE TABLE stock_movements (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    delta      INT          NOT NULL,
    reason     VARCHAR(30)  NOT NULL,
    reference  VARCHAR(100),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_product_id ON stock_movements (product_id, created_at);

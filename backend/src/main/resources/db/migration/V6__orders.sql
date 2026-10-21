CREATE TABLE orders (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT         NOT NULL REFERENCES users (id),
    status            VARCHAR(20)    NOT NULL
        CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
    total             NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    currency          VARCHAR(3)     NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    shipping_name     VARCHAR(150),
    shipping_line1    VARCHAR(255),
    shipping_line2    VARCHAR(255),
    shipping_city     VARCHAR(120),
    shipping_state    VARCHAR(120),
    shipping_postal   VARCHAR(20),
    shipping_country  VARCHAR(2),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user_id ON orders (user_id, created_at);
CREATE INDEX idx_orders_status ON orders (status);

CREATE TABLE order_items (
    id           BIGSERIAL PRIMARY KEY,
    order_id     BIGINT         NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id   BIGINT         NOT NULL REFERENCES products (id),
    product_name VARCHAR(200)   NOT NULL,
    sku          VARCHAR(64)    NOT NULL,
    unit_price   NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    quantity     INT            NOT NULL CHECK (quantity > 0),
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    sku         VARCHAR(64)    NOT NULL UNIQUE,
    slug        VARCHAR(220)   NOT NULL UNIQUE,
    name        VARCHAR(200)   NOT NULL,
    description TEXT,
    price       NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    currency    VARCHAR(3)     NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
    category_id BIGINT         NOT NULL REFERENCES categories (id),
    active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_name_lower ON products (lower(name));
CREATE INDEX idx_products_price ON products (price);
CREATE INDEX idx_products_created_at ON products (created_at);

CREATE TABLE product_images (
    id           BIGSERIAL PRIMARY KEY,
    product_id   BIGINT       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    object_key   VARCHAR(500) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes   BIGINT       NOT NULL CHECK (size_bytes >= 0),
    position     INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_images_product_id ON product_images (product_id, position);

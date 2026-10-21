CREATE TABLE payments (
    id                BIGSERIAL PRIMARY KEY,
    order_id          BIGINT         NOT NULL REFERENCES orders (id),
    stripe_session_id VARCHAR(255)   NOT NULL UNIQUE,
    payment_intent_id VARCHAR(255),
    status            VARCHAR(20)    NOT NULL
        CHECK (status IN ('CREATED', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'REFUNDED')),
    amount            NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency          VARCHAR(3)     NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_payment_intent_id ON payments (payment_intent_id);

CREATE TABLE processed_stripe_events (
    event_id     VARCHAR(255) PRIMARY KEY,
    event_type   VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

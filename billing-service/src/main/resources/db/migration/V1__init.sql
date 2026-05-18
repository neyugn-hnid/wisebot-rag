CREATE SCHEMA IF NOT EXISTS billing_service;
SET search_path TO billing_service, public;

CREATE TABLE IF NOT EXISTS billing_plans
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_plan_prices
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES billing_plans(id) ON DELETE CASCADE,
    billing_cycle VARCHAR(20) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    amount_cents INT NOT NULL CHECK (amount_cents >= 0),
    trial_days INT NOT NULL DEFAULT 0,
    effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP,
    UNIQUE (plan_id, billing_cycle, currency, effective_from)
);

CREATE TABLE IF NOT EXISTS billing_subscriptions
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE,
    plan_id UUID NOT NULL REFERENCES billing_plans(id),
    price_id UUID REFERENCES billing_plan_prices(id),
    status VARCHAR(20) NOT NULL,
    seats INT NOT NULL DEFAULT 1 CHECK (seats > 0),
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_usage_meters
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_code VARCHAR(60) NOT NULL UNIQUE,
    meter_name VARCHAR(120) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    aggregation VARCHAR(20) NOT NULL DEFAULT 'SUM',
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS billing_usage_events
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    meter_id UUID NOT NULL REFERENCES billing_usage_meters(id),
    event_key VARCHAR(120) NOT NULL UNIQUE,
    quantity NUMERIC(18,6) NOT NULL CHECK (quantity >= 0),
    occurred_at TIMESTAMP NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_invoices
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id),
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    subtotal_cents INT NOT NULL DEFAULT 0,
    tax_cents INT NOT NULL DEFAULT 0,
    total_cents INT NOT NULL DEFAULT 0,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_invoice_items
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(18,6) NOT NULL DEFAULT 1,
    unit_amount_cents INT NOT NULL DEFAULT 0,
    amount_cents INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS billing_payments
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES billing_invoices(id),
    provider VARCHAR(30) NOT NULL,
    provider_payment_id VARCHAR(120),
    status VARCHAR(20) NOT NULL,
    amount_cents INT NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    paid_at TIMESTAMP,
    raw_payload JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status ON billing_subscriptions (plan_id, status);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_meter_time ON billing_usage_events (tenant_id, meter_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON billing_invoices (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_status ON billing_payments (invoice_id, status);

INSERT INTO billing_plans (id, code, name, description, active) VALUES
  (gen_random_uuid(), 'free', 'Miễn phí', E'Lên đến 1.000 tin nhắn\n1 Cơ sở tri thức\nTối đa 10 tài liệu tải lên\nDung lượng lưu trữ 100 MB\nTruy cập API', true),
  (gen_random_uuid(), 'plus', 'Plus', E'Lên đến 10.000 tin nhắn\n5 Cơ sở tri thức\nTối đa 200 tài liệu tải lên\nDung lượng lưu trữ 5 GB\nTruy cập API\nTích hợp tùy chỉnh', true),
  (gen_random_uuid(), 'pro', 'Pro', E'Không giới hạn tin nhắn\nKhông giới hạn Cơ sở tri thức\nKhông giới hạn tài liệu tải lên\nDung lượng lưu trữ 50 GB\nTruy cập API\nTích hợp tùy chỉnh', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

INSERT INTO billing_plan_prices (plan_id, billing_cycle, currency, amount_cents, trial_days, effective_from)
SELECT p.id, 'MONTHLY', 'VND', price_cents, 0, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('free', 0),
    ('plus', 501581),
    ('pro', 1293551)
) AS t(code, price_cents)
JOIN billing_plans p ON p.code = t.code
WHERE NOT EXISTS (
  SELECT 1
  FROM billing_plan_prices bpp
  WHERE bpp.plan_id = p.id
    AND bpp.billing_cycle = 'MONTHLY'
    AND bpp.currency = 'VND'
);

INSERT INTO billing_plan_prices (plan_id, billing_cycle, currency, amount_cents, trial_days, effective_from)
SELECT p.id, 'YEARLY', 'VND', price_cents, 0, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('free', 0),
    ('plus', 4815178),
    ('pro', 12418090)
) AS t(code, price_cents)
JOIN billing_plans p ON p.code = t.code
WHERE NOT EXISTS (
  SELECT 1
  FROM billing_plan_prices bpp
  WHERE bpp.plan_id = p.id
    AND bpp.billing_cycle = 'YEARLY'
    AND bpp.currency = 'VND'
);

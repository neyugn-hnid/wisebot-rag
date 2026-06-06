CREATE SCHEMA IF NOT EXISTS billing_service;
SET search_path TO billing_service, public;

INSERT INTO billing_plans (
    id,
    code,
    name,
    description,
    active
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'free', 'Miễn phí', E'Lên đến 1.000 tin nhắn\n1 Cơ sở tri thức\nTối đa 10 tài liệu tải lên\nDung lượng lưu trữ 100 MB\nTruy cập API', true),
  ('22222222-2222-2222-2222-222222222222', 'plus', 'Plus', E'Lên đến 10.000 tin nhắn\n5 Cơ sở tri thức\nTối đa 200 tài liệu tải lên\nDung lượng lưu trữ 5 GB\nTruy cập API\nTích hợp tùy chỉnh', true),
  ('33333333-3333-3333-3333-333333333333', 'pro', 'Pro', E'Không giới hạn tin nhắn\nKhông giới hạn Cơ sở tri thức\nKhông giới hạn tài liệu tải lên\nDung lượng lưu trữ 50 GB\nTruy cập API\nTích hợp tùy chỉnh', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

INSERT INTO billing_plan_prices (
    plan_id,
    billing_cycle,
    currency,
    amount_cents,
    trial_days,
    effective_from
)
SELECT plan_id, billing_cycle, currency, amount_cents, trial_days, effective_from
FROM (
  VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, 'MONTHLY', 'VND', 0, 0, TIMESTAMP '2026-01-01 00:00:00'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'MONTHLY', 'VND', 501581, 0, TIMESTAMP '2026-01-01 00:00:00'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'MONTHLY', 'VND', 1293551, 0, TIMESTAMP '2026-01-01 00:00:00'),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'YEARLY', 'VND', 0, 0, TIMESTAMP '2026-01-01 00:00:00'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'YEARLY', 'VND', 4815178, 0, TIMESTAMP '2026-01-01 00:00:00'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'YEARLY', 'VND', 12418090, 0, TIMESTAMP '2026-01-01 00:00:00')
) AS seed(plan_id, billing_cycle, currency, amount_cents, trial_days, effective_from)
ON CONFLICT (plan_id, billing_cycle, currency, effective_from) DO UPDATE
SET amount_cents = EXCLUDED.amount_cents,
    trial_days = EXCLUDED.trial_days;

INSERT INTO billing_subscriptions (
    id,
    tenant_id,
    plan_id,
    price_id,
    status,
    seats,
    current_period_start,
    current_period_end,
    cancel_at_period_end
)
SELECT
    '44444444-4444-4444-4444-444444444444'::uuid,
    '33f0dc52-44da-4410-ac20-feb4f5578316'::uuid,
    p.id,
    pp.id,
    'ACTIVE',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    false
FROM billing_plans p
LEFT JOIN LATERAL (
    SELECT id
    FROM billing_plan_prices
    WHERE plan_id = p.id
      AND billing_cycle = 'MONTHLY'
      AND currency = 'VND'
    ORDER BY effective_from DESC
    LIMIT 1
) pp ON true
WHERE p.code = 'pro'
ON CONFLICT (tenant_id) DO UPDATE
SET plan_id = EXCLUDED.plan_id,
    price_id = EXCLUDED.price_id,
    status = 'ACTIVE',
    seats = EXCLUDED.seats,
    current_period_end = GREATEST(billing_subscriptions.current_period_end, EXCLUDED.current_period_end),
    cancel_at_period_end = false,
    canceled_at = NULL,
    updated_at = CURRENT_TIMESTAMP;

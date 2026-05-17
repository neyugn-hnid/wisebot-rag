SET search_path TO billing_service, public;

-- Seed default billing plans
INSERT INTO billing_plans (id, code, name, description, active) VALUES
  (gen_random_uuid(), 'free', 'Miễn phí', E'Lên đến 1.000 tin nhắn\n1 Cơ sở tri thức\nHỗ trợ tiêu chuẩn', true),
  (gen_random_uuid(), 'plus', 'Plus', E'Lên đến 10.000 tin nhắn\n5 Cơ sở tri thức\nHỗ trợ ưu tiên\nTruy cập API', true),
  (gen_random_uuid(), 'pro', 'Pro', E'Không giới hạn tin nhắn\nKhông giới hạn Cơ sở tri thức\nHỗ trợ tận tâm\nTích hợp tùy chỉnh\nPhân tích nâng cao', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- Insert prices using subqueries to get the plan IDs
INSERT INTO billing_plan_prices (plan_id, billing_cycle, currency, amount_cents, trial_days, effective_from)
SELECT p.id, 'MONTHLY', 'VND', price_cents, 0, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('free', 0),
    ('plus', 190000),
    ('pro', 490000)
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
    ('plus', 1824000),
    ('pro', 4704000)
) AS t(code, price_cents)
JOIN billing_plans p ON p.code = t.code
WHERE NOT EXISTS (
  SELECT 1
  FROM billing_plan_prices bpp
  WHERE bpp.plan_id = p.id
    AND bpp.billing_cycle = 'YEARLY'
    AND bpp.currency = 'VND'
);

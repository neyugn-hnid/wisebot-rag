SET search_path TO billing_service, public;

-- Seed default billing plans
INSERT INTO billing_plans (id, code, name, description, active) VALUES
  (gen_random_uuid(), 'free', 'Free', 'Perfect for trying out WiseBot with basic features', true),
  (gen_random_uuid(), 'plus', 'Plus', 'For growing teams that need more power', true),
  (gen_random_uuid(), 'pro', 'Pro', 'For professionals who need advanced AI capabilities', true);

-- Insert prices using subqueries to get the plan IDs
INSERT INTO billing_plan_prices (plan_id, billing_cycle, currency, amount_cents, trial_days, effective_from)
SELECT p.id, 'MONTHLY', 'USD', price_cents, 0, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('free', 0),
    ('plus', 1900),
    ('pro', 4900)
) AS t(code, price_cents)
JOIN billing_plans p ON p.code = t.code;

INSERT INTO billing_plan_prices (plan_id, billing_cycle, currency, amount_cents, trial_days, effective_from)
SELECT p.id, 'YEARLY', 'USD', price_cents, 0, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('free', 0),
    ('plus', 18240),
    ('pro', 47040)
) AS t(code, price_cents)
JOIN billing_plans p ON p.code = t.code;

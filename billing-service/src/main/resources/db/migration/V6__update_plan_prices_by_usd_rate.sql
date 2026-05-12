SET search_path TO billing_service, public;

UPDATE billing_plan_prices bpp
SET amount_cents = CASE
    WHEN bp.code = 'free' AND bpp.billing_cycle = 'MONTHLY' THEN 0
    WHEN bp.code = 'free' AND bpp.billing_cycle = 'YEARLY' THEN 0
    WHEN bp.code = 'plus' AND bpp.billing_cycle = 'MONTHLY' THEN 501581
    WHEN bp.code = 'plus' AND bpp.billing_cycle = 'YEARLY' THEN 4815178
    WHEN bp.code = 'pro' AND bpp.billing_cycle = 'MONTHLY' THEN 1293551
    WHEN bp.code = 'pro' AND bpp.billing_cycle = 'YEARLY' THEN 12418090
    ELSE bpp.amount_cents
END
FROM billing_plans bp
WHERE bpp.plan_id = bp.id
  AND bp.code IN ('free', 'plus', 'pro');

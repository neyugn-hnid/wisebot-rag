SET search_path TO billing_service, public;

ALTER TABLE billing_plan_prices
    ALTER COLUMN currency SET DEFAULT 'VND';

ALTER TABLE billing_invoices
    ALTER COLUMN currency SET DEFAULT 'VND';

ALTER TABLE billing_payments
    ALTER COLUMN currency SET DEFAULT 'VND';

UPDATE billing_plan_prices
SET currency = 'VND',
    amount_cents = CASE
        WHEN currency = 'USD' AND amount_cents > 0 THEN amount_cents * 100
        ELSE amount_cents
    END
WHERE currency <> 'VND' OR amount_cents IN (1900, 4900, 18240, 47040);

UPDATE billing_invoices
SET currency = 'VND',
    subtotal_cents = CASE
        WHEN currency = 'USD' AND subtotal_cents > 0 THEN subtotal_cents * 100
        ELSE subtotal_cents
    END,
    tax_cents = CASE
        WHEN currency = 'USD' AND tax_cents > 0 THEN tax_cents * 100
        ELSE tax_cents
    END,
    total_cents = CASE
        WHEN currency = 'USD' AND total_cents > 0 THEN total_cents * 100
        ELSE total_cents
    END
WHERE currency <> 'VND';

UPDATE billing_payments
SET currency = 'VND',
    amount_cents = CASE
        WHEN currency = 'USD' AND amount_cents > 0 THEN amount_cents * 100
        ELSE amount_cents
    END
WHERE currency <> 'VND';

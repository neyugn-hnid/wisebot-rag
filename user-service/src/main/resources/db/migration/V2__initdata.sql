-- ===============================
-- ROLES
-- ===============================
INSERT INTO roles (name, description)
VALUES
    ('ADMIN', 'Administrator'),
    ('USER', 'Normal user'),
    ('OWNER', 'Tenant owner')
    ON CONFLICT (name) DO NOTHING;

-- ===============================
-- PERMISSIONS
-- ===============================
INSERT INTO permissions (name, description)
VALUES
    ('READ', 'Read access'),
    ('WRITE', 'Write access'),
    ('DELETE', 'Delete access')
    ON CONFLICT (name) DO NOTHING;

-- ===============================
-- TENANT DEMO
-- ===============================
INSERT INTO tenants (id, name, plan)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Wisebot Demo', 'PRO')
    ON CONFLICT (name) DO NOTHING;

-- ===============================
-- USER DEMO
-- ===============================
INSERT INTO users (id, tenant_id, username, email, password, full_name)
VALUES (
           'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
           '11111111-1111-1111-1111-111111111111',
           'admin',
           'admin@wisebot.com',
           '$2a$10$hashedpassword',
           'Admin User'
       )
    ON CONFLICT (email) DO NOTHING;

-- ===============================
-- USER ROLE
-- ===============================
INSERT INTO user_roles (user_id, role_id)
SELECT
    u.id,
    r.id
FROM users u, roles r
WHERE u.username = 'admin'
  AND r.name = 'ADMIN'
    ON CONFLICT (user_id, role_id) DO NOTHING;

-- ===============================
-- ROLE PERMISSIONS
-- ===============================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMIN'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
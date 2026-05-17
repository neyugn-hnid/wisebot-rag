SET search_path TO billing_service, public;

UPDATE billing_plans
SET description = CASE code
    WHEN 'free' THEN E'Lên đến 1.000 tin nhắn\n1 Cơ sở tri thức\nTối đa 10 tài liệu tải lên\nDung lượng lưu trữ 100 MB\nTruy cập API'
    WHEN 'plus' THEN E'Lên đến 10.000 tin nhắn\n5 Cơ sở tri thức\nTối đa 200 tài liệu tải lên\nDung lượng lưu trữ 5 GB\nTruy cập API\nTích hợp tùy chỉnh'
    WHEN 'pro' THEN E'Không giới hạn tin nhắn\nKhông giới hạn Cơ sở tri thức\nKhông giới hạn tài liệu tải lên\nDung lượng lưu trữ 50 GB\nTruy cập API\nTích hợp tùy chỉnh'
    ELSE description
END
WHERE code IN ('free', 'plus', 'pro');

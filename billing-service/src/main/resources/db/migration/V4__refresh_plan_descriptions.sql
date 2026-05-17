SET search_path TO billing_service, public;

UPDATE billing_plans
SET description = CASE code
    WHEN 'free' THEN E'Lên đến 1.000 tin nhắn\n1 Cơ sở tri thức\nTối đa 10 tài liệu tải lên\nDung lượng lưu trữ 100 MB\nHỗ trợ tiêu chuẩn'
    WHEN 'plus' THEN E'Lên đến 10.000 tin nhắn\n5 Cơ sở tri thức\nTối đa 200 tài liệu tải lên\nDung lượng lưu trữ 5 GB\nHỗ trợ ưu tiên\nTruy cập API'
    WHEN 'pro' THEN E'Không giới hạn tin nhắn\nKhông giới hạn Cơ sở tri thức\nKhông giới hạn tài liệu tải lên\nDung lượng lưu trữ 50 GB\nHỗ trợ tận tâm\nTích hợp tùy chỉnh\nPhân tích nâng cao'
    ELSE description
END
WHERE code IN ('free', 'plus', 'pro');

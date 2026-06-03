package vandinh.wisebot.userservice.service;

import vandinh.wisebot.userservice.dto.response.SystemSettingResponse;

import java.util.List;
import java.util.UUID;

public interface SystemSettingService {
    List<SystemSettingResponse> listAll();

    SystemSettingResponse getByKey(String key);

    SystemSettingResponse upsert(String key, String value, String description, UUID updatedBy);
}

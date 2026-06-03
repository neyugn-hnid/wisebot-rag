package vandinh.wisebot.userservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.userservice.dto.response.SystemSettingResponse;
import vandinh.wisebot.userservice.entity.SystemSetting;
import vandinh.wisebot.userservice.exception.ResourceNotFoundException;
import vandinh.wisebot.userservice.repository.SystemSettingRepository;
import vandinh.wisebot.userservice.service.SystemSettingService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SystemSettingResponse> listAll() {
        return systemSettingRepository.findAll()
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemSettingResponse getByKey(String key) {
        return systemSettingRepository.findBySettingKey(key)
                .map(this::mapResponse)
                .orElseThrow(() -> new ResourceNotFoundException("System setting not found: " + key));
    }

    @Override
    @Transactional
    public SystemSettingResponse upsert(String key, String value, String description, UUID updatedBy) {
        SystemSetting entity = systemSettingRepository.findBySettingKey(key)
                .orElseGet(() -> SystemSetting.builder().settingKey(key).build());

        entity.setSettingValue(value);
        entity.setDescription(description);
        entity.setUpdatedBy(updatedBy);

        return mapResponse(systemSettingRepository.save(entity));
    }

    private SystemSettingResponse mapResponse(SystemSetting entity) {
        return SystemSettingResponse.builder()
                .id(entity.getId())
                .key(entity.getSettingKey())
                .value(entity.getSettingValue())
                .description(entity.getDescription())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

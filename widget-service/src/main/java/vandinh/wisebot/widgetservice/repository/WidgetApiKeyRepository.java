package vandinh.wisebot.widgetservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.widgetservice.entity.WidgetApiKey;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WidgetApiKeyRepository extends JpaRepository<WidgetApiKey, UUID> {
    List<WidgetApiKey> findAllByWidget_IdOrderByCreatedAtDesc(UUID widgetId);
    Optional<WidgetApiKey> findByKeyHash(String keyHash);
}

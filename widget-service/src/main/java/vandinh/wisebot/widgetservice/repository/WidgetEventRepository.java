package vandinh.wisebot.widgetservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.widgetservice.entity.WidgetEvent;

import java.util.List;
import java.util.UUID;

public interface WidgetEventRepository extends JpaRepository<WidgetEvent, UUID> {
    List<WidgetEvent> findTop50ByWidgetIdOrderByCreatedAtDesc(UUID widgetId);
}

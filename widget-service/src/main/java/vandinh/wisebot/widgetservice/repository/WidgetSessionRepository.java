package vandinh.wisebot.widgetservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.widgetservice.entity.WidgetSession;

import java.util.List;
import java.util.UUID;

public interface WidgetSessionRepository extends JpaRepository<WidgetSession, UUID> {
    List<WidgetSession> findTop100ByWidget_IdOrderByStartedAtDesc(UUID widgetId);
}

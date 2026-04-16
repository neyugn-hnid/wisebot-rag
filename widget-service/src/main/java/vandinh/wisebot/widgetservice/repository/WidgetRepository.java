package vandinh.wisebot.widgetservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.widgetservice.entity.Widget;

import java.util.List;
import java.util.UUID;

public interface WidgetRepository extends JpaRepository<Widget, UUID> {
    List<Widget> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}

package vandinh.wisebot.widgetservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.widgetservice.entity.WidgetAllowedDomain;

import java.util.List;
import java.util.UUID;

public interface WidgetAllowedDomainRepository extends JpaRepository<WidgetAllowedDomain, UUID> {
    List<WidgetAllowedDomain> findAllByWidget_Id(UUID widgetId);
}

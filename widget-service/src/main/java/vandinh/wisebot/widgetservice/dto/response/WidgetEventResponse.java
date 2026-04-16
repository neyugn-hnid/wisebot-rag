package vandinh.wisebot.widgetservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WidgetEventResponse {
    private UUID id;
    private UUID widgetId;
    private UUID tenantId;
    private String eventType;
    private String payload;
    private LocalDateTime createdAt;
}

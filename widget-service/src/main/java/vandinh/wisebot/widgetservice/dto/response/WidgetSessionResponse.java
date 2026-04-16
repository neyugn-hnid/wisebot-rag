package vandinh.wisebot.widgetservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WidgetSessionResponse {
    private UUID id;
    private UUID widgetId;
    private UUID tenantId;
    private String visitorId;
    private UUID userId;
    private String sourceUrl;
    private String referrerUrl;
    private String ipAddress;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}

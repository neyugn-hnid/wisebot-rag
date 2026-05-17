package vandinh.wisebot.widgetservice.dto.response;

import lombok.Builder;
import lombok.Data;
import vandinh.wisebot.widgetservice.dto.WidgetAppearanceConfig;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WidgetResponse {
    private UUID id;
    private UUID tenantId;
    private String name;
    private String code;
    private String status;
    private String welcomeMessage;
    private WidgetAppearanceConfig appearanceConfig;
    private LocalDateTime createdAt;
}

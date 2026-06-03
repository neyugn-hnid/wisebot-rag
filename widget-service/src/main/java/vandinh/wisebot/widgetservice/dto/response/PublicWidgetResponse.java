package vandinh.wisebot.widgetservice.dto.response;

import lombok.Builder;
import lombok.Data;
import vandinh.wisebot.widgetservice.dto.WidgetAppearanceConfig;

import java.util.UUID;

@Data
@Builder
public class PublicWidgetResponse {
    private UUID id;
    private UUID tenantId;
    private String code;
    private String name;
    private String welcomeMessage;
    private WidgetAppearanceConfig appearanceConfig;
}

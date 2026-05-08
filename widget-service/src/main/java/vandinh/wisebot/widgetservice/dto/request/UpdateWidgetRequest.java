package vandinh.wisebot.widgetservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import vandinh.wisebot.widgetservice.dto.WidgetAppearanceConfig;

@Data
public class UpdateWidgetRequest {
    @NotBlank
    private String name;
    private String welcomeMessage;
    private WidgetAppearanceConfig appearanceConfig;
}

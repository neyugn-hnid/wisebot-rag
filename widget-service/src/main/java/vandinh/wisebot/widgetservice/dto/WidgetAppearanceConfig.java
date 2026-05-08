package vandinh.wisebot.widgetservice.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class WidgetAppearanceConfig {
    private String primaryColor;
    private String position;
    private String iconColor;
    private String selectedIconId;
    private String customIconUrl;
    private UUID knowledgeBaseId;
    private Integer topK;
    private Double temperature;
}

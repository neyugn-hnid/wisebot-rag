package vandinh.wisebot.chatservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PublicWidgetAskRequest {
    @NotNull
    private UUID tenantId;
    @NotNull
    private UUID widgetId;
    @NotBlank
    private String question;
    private int topK = 5;
    private double temperature = 0.2;
    private UUID knowledgeBaseId;
}

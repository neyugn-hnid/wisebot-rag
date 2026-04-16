package vandinh.wisebot.chatservice.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateSessionRequest {
    @NotNull
    private UUID tenantId;
    private UUID userId;
    private UUID widgetId;
    private String channel = "WEB";
    private String title;
}

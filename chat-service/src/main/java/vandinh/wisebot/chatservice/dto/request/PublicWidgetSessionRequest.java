package vandinh.wisebot.chatservice.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PublicWidgetSessionRequest {
    @NotNull
    private UUID tenantId;
    private String visitorId;
    private String title;
}

package vandinh.wisebot.widgetservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class TrackEventRequest {
    @NotNull
    private UUID tenantId;
    private UUID sessionId;
    @NotBlank
    private String eventType;
    private String payload;
}

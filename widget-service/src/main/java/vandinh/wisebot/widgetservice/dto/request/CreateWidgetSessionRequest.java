package vandinh.wisebot.widgetservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateWidgetSessionRequest {
    @NotNull
    private UUID tenantId;
    @NotBlank
    private String visitorId;
    private UUID userId;
    private String sourceUrl;
    private String referrerUrl;
    private String ipAddress;
    private String userAgent;
}

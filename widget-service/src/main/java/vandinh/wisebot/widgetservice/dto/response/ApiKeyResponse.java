package vandinh.wisebot.widgetservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ApiKeyResponse {
    private UUID id;
    private UUID widgetId;
    private String keyPrefix;
    private String keyHash;
    private String status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}

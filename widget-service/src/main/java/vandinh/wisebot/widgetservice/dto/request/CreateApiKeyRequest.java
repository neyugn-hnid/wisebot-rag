package vandinh.wisebot.widgetservice.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateApiKeyRequest {
    private LocalDateTime expiresAt;
}

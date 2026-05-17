package vandinh.wisebot.chatservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatSessionResponse {
    private UUID id;
    private UUID tenantId;
    private UUID userId;
    private UUID widgetId;
    private String channel;
    private String title;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime lastMessageAt;
}

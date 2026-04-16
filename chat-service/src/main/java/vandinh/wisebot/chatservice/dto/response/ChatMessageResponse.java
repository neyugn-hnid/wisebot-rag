package vandinh.wisebot.chatservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatMessageResponse {
    private UUID id;
    private UUID sessionId;
    private UUID tenantId;
    private String senderType;
    private UUID senderId;
    private String role;
    private String messageType;
    private String content;
    private LocalDateTime createdAt;
}

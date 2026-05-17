package vandinh.wisebot.chatservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MessageFeedbackResponse {
    private UUID id;
    private UUID messageId;
    private UUID userId;
    private short rating;
    private String reason;
    private String comment;
    private LocalDateTime createdAt;
}

package vandinh.wisebot.chatservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RealtimeEventResponse {
    private String type;
    private UUID sessionId;
    private Object data;
    private LocalDateTime timestamp;
}

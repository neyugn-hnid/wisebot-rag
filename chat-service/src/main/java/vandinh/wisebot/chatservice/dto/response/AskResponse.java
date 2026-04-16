package vandinh.wisebot.chatservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class AskResponse {
    private UUID sessionId;
    private UUID userMessageId;
    private UUID assistantMessageId;
    private String answer;
    private List<ChatMessageCitationResponse> citations;
}

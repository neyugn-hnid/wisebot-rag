package vandinh.wisebot.chatservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ChatMessageCitationResponse {
    private UUID id;
    private UUID messageId;
    private String sourceType;
    private UUID sourceDocumentId;
    private UUID sourceChunkId;
    private String sourceUrl;
    private Double score;
    private String snippet;
}

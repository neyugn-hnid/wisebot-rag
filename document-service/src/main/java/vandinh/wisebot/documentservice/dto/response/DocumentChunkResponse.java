package vandinh.wisebot.documentservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class DocumentChunkResponse {
    private UUID id;
    private UUID documentId;
    private int chunkIndex;
    private String content;
    private String embeddingId;
    private String status;
}

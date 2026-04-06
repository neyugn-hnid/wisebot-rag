package vandinh.wisebot.documentservice.dto.request;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class EmbeddingRequest {
    private UUID knowledgeBaseId;
    private UUID documentId;
    private List<EmbeddingChunk> chunks;

    @Data
    @Builder
    public static class EmbeddingChunk {
        private int index;
        private String content;
    }
}

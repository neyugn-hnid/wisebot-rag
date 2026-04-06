package vandinh.wisebot.documentservice.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class EmbeddingResponse {
    private List<EmbeddingResult> results;

    @Data
    public static class EmbeddingResult {
        private int index;
        private String embeddingId;
    }
}

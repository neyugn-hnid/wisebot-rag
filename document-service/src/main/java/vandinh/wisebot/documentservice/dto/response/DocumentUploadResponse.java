package vandinh.wisebot.documentservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentUploadResponse {
    private DocumentResponse document;
    private int chunkCount;
}

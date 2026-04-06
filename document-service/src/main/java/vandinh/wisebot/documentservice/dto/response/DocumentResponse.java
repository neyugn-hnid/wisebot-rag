package vandinh.wisebot.documentservice.dto.response;

import lombok.Builder;
import lombok.Data;
import vandinh.wisebot.documentservice.common.enums.DocumentStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DocumentResponse {
    private UUID id;
    private UUID knowledgeBaseId;
    private String filename;
    private String contentType;
    private Long size;
    private String storagePath;
    private DocumentStatus status;
    private LocalDateTime createdAt;
}

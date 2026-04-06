package vandinh.wisebot.documentservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DocumentResponse {
    private UUID id;
    private String filename;
    private String contentType;
    private Long size;
    private String storageKey;
    private LocalDateTime createdAt;
}

package vandinh.wisebot.documentservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class KnowledgeBaseResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID tenantId;
    private LocalDateTime createdAt;
}

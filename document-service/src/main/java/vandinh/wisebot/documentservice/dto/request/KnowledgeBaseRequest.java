package vandinh.wisebot.documentservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class KnowledgeBaseRequest {
    @NotBlank(message = "name must be not blank")
    private String name;
    private String description;
    private UUID tenantId;
}

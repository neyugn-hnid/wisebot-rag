package vandinh.wisebot.documentservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class KnowledgeBaseRequest {
    @NotBlank(message = "Tên kho tri thức không được để trống")
    private String name;
    private String description;
    private UUID tenantId;
}

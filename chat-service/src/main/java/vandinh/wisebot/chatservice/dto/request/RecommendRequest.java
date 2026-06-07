package vandinh.wisebot.chatservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
public class RecommendRequest {

    @NotBlank
    private String question;

    // Optional: page context (product name, category...)
    private Map<String, Object> pageContext;

    // Optional: developer API can target a specific knowledge base.
    private UUID knowledgeBaseId;

    // Optional: override topK
    private int topK = 5;

    // Optional: override temperature
    private double temperature = 0.2;
}

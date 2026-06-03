package vandinh.wisebot.chatservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class RecommendRequest {

    @NotBlank
    private String question;

    // Optional: page context (product name, category...)
    private Map<String, Object> pageContext;

    // Optional: override topK
    private int topK = 5;

    // Optional: override temperature
    private double temperature = 0.2;
}

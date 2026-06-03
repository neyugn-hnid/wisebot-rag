package vandinh.wisebot.chatservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class AskRequest {
    @NotBlank
    private String question;
    private int topK = 5;
    private double temperature = 0.2;
    private java.util.UUID knowledgeBaseId;

    // Page context: thông tin trang hiện tại
    private Map<String, Object> pageContext;
}

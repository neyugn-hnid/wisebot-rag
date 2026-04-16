package vandinh.wisebot.chatservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class SendMessageRequest {
    private UUID senderId;
    private String senderType = "USER";
    private String role = "USER";
    private String messageType = "TEXT";
    @NotBlank
    private String content;
}

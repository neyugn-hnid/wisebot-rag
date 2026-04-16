package vandinh.wisebot.chatservice.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class MessageFeedbackRequest {
    @NotNull
    private UUID userId;
    @Min(-1)
    @Max(1)
    private short rating;
    private String reason;
    private String comment;
}

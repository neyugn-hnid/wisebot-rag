package vandinh.wisebot.widgetservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DomainResponse {
    private UUID id;
    private UUID widgetId;
    private String domain;
    private boolean allowSubdomains;
    private LocalDateTime verifiedAt;
}

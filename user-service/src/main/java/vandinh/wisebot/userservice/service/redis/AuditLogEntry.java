package vandinh.wisebot.userservice.service.redis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntry {
    private String userId;
    private String action;
    private String resource;
    private String endpoint;
    private String method;
    private String timestamp;
    private int status;
    private String ipAddress;
    private String userAgent;
}

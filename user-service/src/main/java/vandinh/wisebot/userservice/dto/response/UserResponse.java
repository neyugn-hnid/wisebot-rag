package vandinh.wisebot.userservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String avatarUrl;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private LocalDateTime createdAt;
}

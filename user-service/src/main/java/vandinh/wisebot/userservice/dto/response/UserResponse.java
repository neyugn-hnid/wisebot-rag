package vandinh.wisebot.userservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Date;

@Data
@Builder
public class UserResponse {
    private long id;
    private String avatarUrl;
    private String fullName;
    private String usename;
    private String email;
    private String phone;
    private Date createdAt;
}

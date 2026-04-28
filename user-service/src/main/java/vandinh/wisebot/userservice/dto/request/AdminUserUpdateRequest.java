package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Data;
import vandinh.wisebot.userservice.common.enums.UserStatus;

import java.io.Serializable;

@Data
public class AdminUserUpdateRequest implements Serializable {
    private String fullName;

    @Email(message = "email must be a valid email address")
    private String email;

    private String phone;
    private String role;
    private UserStatus status;
}

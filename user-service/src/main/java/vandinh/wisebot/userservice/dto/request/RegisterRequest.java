package vandinh.wisebot.userservice.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String username;
    private String email;
    private String password;
    private String confirmPassword;
    private Boolean isEmailVerified;
}

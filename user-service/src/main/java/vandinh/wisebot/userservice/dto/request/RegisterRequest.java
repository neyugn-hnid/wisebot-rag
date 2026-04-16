package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.ToString;

import java.io.Serializable;

@Data
@ToString
public class RegisterRequest implements Serializable {
    @NotBlank(message = "fullName must be not blank")
    private String fullName;

    @NotBlank(message = "username must be not blank")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "username must be alphanumeric with underscores")
    private String username;

    @NotBlank(message = "email must be not blank")
    @Email(message = "email must be a valid email address")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@gmail\\.com$", message = "email must be a valid Gmail address")
    private String email;

    @NotBlank(message = "password must be not blank")
    private String password;
    
    @NotBlank(message = "confirmPassword must be not blank")
    private String confirmPassword;
    private Boolean isEmailVerified;
    private String inviteToken;
}

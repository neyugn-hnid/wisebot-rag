package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

import java.io.Serializable;

@Data
@ToString
public class ChangePasswordRequest implements Serializable {
    @NotBlank(message = "currentPassword must be not blank")
    private String currentPassword;

    @NotBlank(message = "newPassword must be not blank")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).{8,}$",
            message = "Password must contain at least 1 uppercase letter and 1 number")
    private String newPassword;

    @NotBlank(message = "confirmNewPassword must be not blank")
    private String confirmNewPassword;
}

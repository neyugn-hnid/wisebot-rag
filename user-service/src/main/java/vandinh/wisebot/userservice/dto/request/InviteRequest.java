package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteRequest {
    @NotBlank(message = "email must be not blank")
    @Email(message = "email must be a valid email address")
    private String email;
}

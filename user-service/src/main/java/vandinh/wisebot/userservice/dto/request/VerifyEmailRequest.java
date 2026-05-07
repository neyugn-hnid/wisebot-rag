package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyEmailRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "OTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP phải gồm 6 chữ số")
    private String otp;
}
package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

import java.io.Serializable;

@Data
@ToString
public class ForgotPasswordRequest implements Serializable {
    @NotBlank(message = "Email không được để trống")
    private String email;
     
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP phải gồm 6 chữ số")
    private String otp;

    @Size(min = 8, max = 100, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).{8,}$",
            message = "Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 số")
    private String newPassword;

    private String confirmNewPassword;
}

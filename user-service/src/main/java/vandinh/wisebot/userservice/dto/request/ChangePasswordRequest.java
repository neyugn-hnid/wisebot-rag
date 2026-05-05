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
    @NotBlank(message = "Mật khẩu hiện tại không được để trống")
    private String currentPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 100, message = "Mật khẩu phải có ít nhất 8 ký tự")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).{8,}$",
            message = "Mật khẩu phải chứa ít nhất 1 chữ hoa và 1 số")
    private String newPassword;

    @NotBlank(message = "Xác nhận mật khẩu mới không được để trống")
    private String confirmNewPassword;
}

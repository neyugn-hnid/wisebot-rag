package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.ToString;

import java.io.Serializable;

@Data
@ToString
public class EmailUpdateRequest implements Serializable {
    @Email(message = "Email không đúng định dạng")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@gmail\\.com$", message = "Email phải là địa chỉ Gmail hợp lệ")
    @NotBlank(message = "Email mới không được để trống")
    private String newEmail;
}

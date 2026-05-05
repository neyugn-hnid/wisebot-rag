package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.io.Serializable;

@Data
@Getter
@Setter
@ToString
public class UserUpdateRequest implements Serializable {
    @NotBlank(message = "Họ tên không được để trống.")
    private String fullName;
    @NotBlank(message = "Số điện thoại không được để trống.")
    private String phone;
}

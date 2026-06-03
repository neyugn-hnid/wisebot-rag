package vandinh.wisebot.userservice.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import vandinh.wisebot.userservice.common.enums.LoginProvider;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@ToString
public class LoginRequest implements Serializable {
    @JsonAlias({"username", "email"})
    @NotBlank(message = "Tên đăng nhập không được để trống.")
    private String username;
    @NotBlank(message = "Mật khẩu không được để trống.")
    private String password;
    private String platForm;
    private String deviceToken;
    private String versionApp;
    private LoginProvider loginProvider;
    private LocalDateTime lastLogin;
}

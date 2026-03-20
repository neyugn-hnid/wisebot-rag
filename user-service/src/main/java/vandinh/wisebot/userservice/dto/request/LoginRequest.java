package vandinh.wisebot.userservice.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Getter;
import lombok.Setter;
import vandinh.wisebot.userservice.common.enums.LoginProvider;

import java.time.LocalDateTime;

@Getter
@Setter
public class LoginRequest {
    @JsonAlias({"username", "email"})
    private String username;
    private String password;
    private String platForm;
    private String deviceToken;
    private String versionApp;
    private LoginProvider loginProvider;
    private LocalDateTime lastLogin;
}

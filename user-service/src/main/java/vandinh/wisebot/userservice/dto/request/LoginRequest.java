package vandinh.wisebot.userservice.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignInRequest {
    @JsonAlias({"username", "email"})
    private String username;
    private String password;
    private String platForm;
    private String diviceToken;
    private String versionApp;
}

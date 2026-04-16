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
    @NotBlank(message = "fullName must be not blank")
    private String fullName;
    @NotBlank(message = "phone must be not blank")
    private String phone;
}

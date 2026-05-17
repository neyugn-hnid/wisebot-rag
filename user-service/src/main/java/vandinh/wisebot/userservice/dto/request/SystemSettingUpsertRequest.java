package vandinh.wisebot.userservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SystemSettingUpsertRequest {
    @NotBlank
    private String value;
    private String description;
}

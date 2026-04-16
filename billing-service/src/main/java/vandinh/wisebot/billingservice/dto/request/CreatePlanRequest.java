package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePlanRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String name;
    private String description;
}

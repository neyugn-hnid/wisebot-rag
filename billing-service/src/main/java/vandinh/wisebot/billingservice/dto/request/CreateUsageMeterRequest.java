package vandinh.wisebot.billingservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUsageMeterRequest {
    @NotBlank
    private String meterCode;
    @NotBlank
    private String meterName;
    @NotBlank
    private String unit;
    private String aggregation = "SUM";
}

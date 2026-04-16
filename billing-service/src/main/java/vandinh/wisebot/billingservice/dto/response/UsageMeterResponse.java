package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UsageMeterResponse {
    private UUID id;
    private String meterCode;
    private String meterName;
    private String unit;
    private String aggregation;
    private boolean active;
}

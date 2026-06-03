package vandinh.wisebot.billingservice.dto.request;

import lombok.Data;

@Data
public class UpdatePlanRequest {
    private String code;
    private String name;
    private String description;
    private Boolean active;
}

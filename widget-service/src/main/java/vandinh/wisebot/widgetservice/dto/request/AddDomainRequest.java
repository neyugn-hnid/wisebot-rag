package vandinh.wisebot.widgetservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddDomainRequest {
    @NotBlank
    private String domain;
    private boolean allowSubdomains;
}

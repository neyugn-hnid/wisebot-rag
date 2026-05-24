package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VietQRConfigResponse {
    private String bankCode;
    private String accountNo;
    private String accountName;
    private String template;
}

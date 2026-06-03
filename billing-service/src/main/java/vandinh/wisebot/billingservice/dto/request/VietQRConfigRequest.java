package vandinh.wisebot.billingservice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VietQRConfigRequest {
    private String bankCode;
    private String accountNo;
    private String accountName;
}

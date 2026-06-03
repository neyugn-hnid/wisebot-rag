package vandinh.wisebot.billingservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "vietqr")
public class VietQRConfig {
    /** Mã ngân hàng (NAPAS BIN) - vd: 970422 cho MB Bank */
    private String bankCode = "970422";

    /** Số tài khoản nhận tiền */
    private String accountNo = "";

    /** Tên tài khoản */
    private String accountName = "";

    /** Mẫu QR: qr_only, compact, print */
    private String template = "qr_only";
}

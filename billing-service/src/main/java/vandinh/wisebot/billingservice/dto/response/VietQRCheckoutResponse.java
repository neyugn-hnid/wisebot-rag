package vandinh.wisebot.billingservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class VietQRCheckoutResponse {
    private String orderId;
    private UUID invoiceId;
    private int amount;
    private String currency;
    private String description;
    /** URL ảnh QR code để hiển thị cho user quét */
    private String qrImageUrl;
    /** Deep link mở app ngân hàng trên mobile */
    private String deepLink;
    private String bankAccount;
    private String bankName;
    private String accountName;
    private LocalDateTime expiresAt;
}

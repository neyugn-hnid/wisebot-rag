package vandinh.wisebot.chatservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductItem {
    private int id;
    private String name;
    private long price;
    private String imageUrl;
    private String detailUrl;
    private String reason;
}

package vandinh.wisebot.userservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;

@Data
@Builder
public class UserListStatsResponse implements Serializable {
    private long total;
    private long admins;
    private long active;
    private long suspended;
}

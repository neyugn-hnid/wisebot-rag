package vandinh.wisebot.userservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
public class UserPageResponse implements Serializable {
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private UserListStatsResponse stats;
    private List<UserResponse> users;
}

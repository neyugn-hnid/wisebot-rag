package vandinh.wisebot.userservice.dto.request;

import lombok.Data;
import lombok.ToString;
import vandinh.wisebot.userservice.common.enums.UserStatus;

import java.io.Serializable;

@Data
@ToString
public class ChangeStatusRequest implements Serializable {
    private UserStatus newStatus;
}

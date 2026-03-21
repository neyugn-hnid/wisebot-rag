package vandinh.wisebot.userservice.dto.request;

import lombok.Data;
import lombok.ToString;

import java.io.Serializable;

@Data
@ToString
public class EmailUpdateRequest implements Serializable {
    private String newEmail;
}

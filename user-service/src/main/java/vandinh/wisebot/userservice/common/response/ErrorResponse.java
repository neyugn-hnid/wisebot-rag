package vandinh.wisebot.userservice.common.response;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Date;

@Getter
@Setter
@Data
public class ErrorResponse implements Serializable {
    private Date timestamp;
    private int status;
    private String path;
    private String error;
    private String message;
}
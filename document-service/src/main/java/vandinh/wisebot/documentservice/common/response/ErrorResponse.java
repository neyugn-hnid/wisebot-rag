package vandinh.wisebot.documentservice.common.response;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;

@Data
public class ErrorResponse implements Serializable {
    private Date timestamp;
    private int status;
    private String path;
    private String error;
    private String message;
}

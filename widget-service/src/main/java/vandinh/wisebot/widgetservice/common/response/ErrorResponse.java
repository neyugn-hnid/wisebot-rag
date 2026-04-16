package vandinh.wisebot.widgetservice.common.response;

import lombok.Data;

import java.util.Date;

@Data
public class ErrorResponse {
    private Date timestamp;
    private String path;
    private int status;
    private String error;
    private String message;
}

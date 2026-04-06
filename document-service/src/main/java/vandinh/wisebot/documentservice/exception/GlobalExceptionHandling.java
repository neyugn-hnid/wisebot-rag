package vandinh.wisebot.documentservice.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import vandinh.wisebot.documentservice.common.response.ErrorResponse;

import java.util.Date;

@RestControllerAdvice
public class GlobalExceptionHandling {

    @ExceptionHandler({ConstraintViolationException.class,
            MissingServletRequestParameterException.class, MethodArgumentNotValidException.class})
    public ErrorResponse handleValidationException(Exception e, WebRequest request) {
        String message;
        String error;

        if (e instanceof MethodArgumentNotValidException ex) {
            String raw = ex.getMessage();
            int start = raw.lastIndexOf("[") + 1;
            int end = raw.lastIndexOf("]") - 1;
            message = raw.substring(start, end);
            error = "Invalid Payload";
        } else if (e instanceof MissingServletRequestParameterException) {
            message = e.getMessage();
            error = "Invalid Parameter";
        } else if (e instanceof ConstraintViolationException) {
            message = e.getMessage().substring(e.getMessage().indexOf(" ") + 1);
            error = "Invalid Parameter";
        } else {
            message = e.getMessage();
            error = "Invalid Data";
        }

        return buildErrorResponse(request, HttpStatus.BAD_REQUEST, error, message);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ErrorResponse handleResourceNotFoundException(ResourceNotFoundException e, WebRequest request) {
        return buildErrorResponse(request, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND.getReasonPhrase(), e.getMessage());
    }

    @ExceptionHandler(InvalidDataException.class)
    public ErrorResponse handleInvalidDataException(InvalidDataException e, WebRequest request) {
        return buildErrorResponse(request, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST.getReasonPhrase(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ErrorResponse handleException(Exception e, WebRequest request) {
        return buildErrorResponse(request, HttpStatus.INTERNAL_SERVER_ERROR,
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(), "Unexpected error");
    }

    private ErrorResponse buildErrorResponse(WebRequest request, HttpStatus status, String error, String message) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
        errorResponse.setStatus(status.value());
        errorResponse.setError(error);
        errorResponse.setMessage(message);
        return errorResponse;
    }
}

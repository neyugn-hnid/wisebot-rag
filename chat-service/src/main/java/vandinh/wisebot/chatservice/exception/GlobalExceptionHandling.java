package vandinh.wisebot.chatservice.exception;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import vandinh.wisebot.chatservice.common.response.ErrorResponse;

import java.util.Date;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandling {

    @ExceptionHandler({ConstraintViolationException.class,
            MissingServletRequestParameterException.class, MethodArgumentNotValidException.class})
    public ErrorResponse handleValidationException(Exception e, WebRequest request) {
        return buildErrorResponse(request, HttpStatus.BAD_REQUEST, "Invalid Payload", e.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ErrorResponse handleResourceNotFoundException(ResourceNotFoundException e, WebRequest request) {
        return buildErrorResponse(request, HttpStatus.NOT_FOUND, HttpStatus.NOT_FOUND.getReasonPhrase(), e.getMessage());
    }

    @ExceptionHandler(InvalidDataException.class)
    public ErrorResponse handleInvalidDataException(InvalidDataException e, WebRequest request) {
        return buildErrorResponse(request, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST.getReasonPhrase(), e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ErrorResponse handleIllegalArgumentException(IllegalArgumentException e, WebRequest request) {
        return buildErrorResponse(request, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST.getReasonPhrase(), e.getMessage());
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ErrorResponse handleRestClientResponseException(RestClientResponseException e, WebRequest request) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }

        String responseBody = e.getResponseBodyAsString();
        String message = (responseBody == null || responseBody.isBlank()) ? e.getMessage() : responseBody;
        log.error("Downstream service returned {} for {}: {}", status.value(), request.getDescription(false), message, e);
        return buildErrorResponse(request, status, status.getReasonPhrase(), message);
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ErrorResponse handleResourceAccessException(ResourceAccessException e, WebRequest request) {
        log.error("Downstream service unreachable for {}", request.getDescription(false), e);
        return buildErrorResponse(
                request,
                HttpStatus.BAD_GATEWAY,
                HttpStatus.BAD_GATEWAY.getReasonPhrase(),
                "Downstream service unreachable: " + e.getMessage()
        );
    }

    @ExceptionHandler(Exception.class)
    public ErrorResponse handleException(Exception e, WebRequest request) {
        log.error("Unhandled exception for {}", request.getDescription(false), e);
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

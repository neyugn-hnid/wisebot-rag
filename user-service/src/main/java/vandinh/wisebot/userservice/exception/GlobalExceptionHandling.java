package vandinh.wisebot.userservice.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import vandinh.wisebot.userservice.common.response.ErrorResponse;

import java.util.Date;

import static org.springframework.http.HttpStatus.*;

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

        return buildErrorResponse(e, request, BAD_REQUEST, error, message);
    }



    @ExceptionHandler({InternalAuthenticationServiceException.class,
            BadCredentialsException.class})
    public ErrorResponse handleInternalAuthenticationServiceException(Exception e, WebRequest request) {
        return buildErrorResponse(e, request, UNAUTHORIZED, UNAUTHORIZED.getReasonPhrase(), "Email or password is incorrect");
    }

    @ExceptionHandler({ForBiddenException.class, AccessDeniedException.class})
    public ErrorResponse handleAccessDeniedException(Exception e, WebRequest request) {
        return buildErrorResponse(e, request, FORBIDDEN, FORBIDDEN.getReasonPhrase(), "You do not have permission to access this resource");
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ErrorResponse handleResourceNotFoundException(ResourceNotFoundException e, WebRequest request) {
        return buildErrorResponse(e, request, NOT_FOUND, NOT_FOUND.getReasonPhrase(), e.getMessage());
    }


    @ExceptionHandler(InvalidDataException.class)
    public ErrorResponse handleInvalidDataException(InvalidDataException e, WebRequest request) {
        return buildErrorResponse(e, request, CONFLICT, CONFLICT.getReasonPhrase(), e.getMessage());
    }


    @ExceptionHandler(Exception.class)
    public ErrorResponse handleException(Exception e, WebRequest request) {
        return buildErrorResponse(e, request, INTERNAL_SERVER_ERROR, INTERNAL_SERVER_ERROR.getReasonPhrase(), "An unexpected error occurred");
    }

    private ErrorResponse buildErrorResponse(Exception e, WebRequest request, HttpStatus status, String error, String message) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
        errorResponse.setStatus(status.value());
        errorResponse.setError(error);
        errorResponse.setMessage(message != null ? message : e.getMessage());
        return errorResponse;
    }

}


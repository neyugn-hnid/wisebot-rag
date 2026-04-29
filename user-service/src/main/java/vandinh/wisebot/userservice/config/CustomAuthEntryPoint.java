package vandinh.wisebot.userservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import vandinh.wisebot.userservice.common.response.ErrorResponse;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Date;

@Component
public class CustomAuthEntryPoint implements AuthenticationEntryPoint {
    private static final String INVALID_CREDENTIALS_MESSAGE = "Email hoặc mật khẩu không đúng.";
    private static final String LOCKED_ACCOUNT_MESSAGE = "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        response.setContentType("application/json");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());

        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
        errorResponse.setError("Unauthorized");
        String path = request.getRequestURI();
        if (path != null && path.startsWith("/auth/login")) {
            String authMessage = authException.getMessage();
            if (authMessage != null && authMessage.toLowerCase().contains("disabled")) {
                errorResponse.setMessage(LOCKED_ACCOUNT_MESSAGE);
            } else {
                errorResponse.setMessage(authMessage != null && !authMessage.isBlank() ? authMessage : INVALID_CREDENTIALS_MESSAGE);
            }
        } else {
            errorResponse.setMessage("Bạn chưa đăng nhập hoặc token không hợp lệ");
        }
        errorResponse.setPath(request.getRequestURI());

        new ObjectMapper().writeValue(response.getOutputStream(), errorResponse);
    }
}

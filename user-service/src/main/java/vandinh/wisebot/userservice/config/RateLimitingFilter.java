package vandinh.wisebot.userservice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import vandinh.wisebot.userservice.common.response.ErrorResponse;
import vandinh.wisebot.userservice.service.security.RateLimiterService;

import java.io.IOException;
import java.util.Date;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "RATE_LIMIT_FILTER")
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;
    private final AppFeatureProperties properties;
    private final ObjectMapper objectMapper;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final int SC_TOO_MANY_REQUESTS = 429;

    private static final String[] AUTH_WHITELIST = {
            "/auth/**",
            "/api/auth/**",
            "/user/auth/**",
            "/swagger-ui/**",
            "/v3/**",
            "/webjars/**",
            "/favicon.ico",
            "/actuator/**"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!properties.getRateLimit().isEnabled() || isWhitelisted(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientKey = resolveClientKey(request);
        if (!rateLimiterService.isAllowed(clientKey)) {
            log.warn("Đã vượt quá giới hạn số lượt truy cập cho khóa {}: {}", clientKey, request.getRequestURI());
            writeErrorResponse(response, request.getRequestURI(), "Quá nhiều yêu cầu", SC_TOO_MANY_REQUESTS);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isWhitelisted(HttpServletRequest request) {
        String path = request.getServletPath();
        for (String pattern : AUTH_WHITELIST) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return false;
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void writeErrorResponse(HttpServletResponse response, String path, String message, int status)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");

        ErrorResponse error = new ErrorResponse();
        error.setTimestamp(new Date());
        error.setStatus(status);
        error.setPath(path);
        error.setError("Quá nhiều yêu cầu");
        error.setMessage(message);

        objectMapper.writeValue(response.getWriter(), error);
    }
}

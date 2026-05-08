package vandinh.wisebot.userservice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.service.security.AuditLogEntry;
import vandinh.wisebot.userservice.service.security.AuditLogService;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "AUDIT_LOG_FILTER")
public class AuditLoggingFilter extends OncePerRequestFilter {

    private final AuditLogService auditLogService;
    private final AppFeatureProperties properties;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        filterChain.doFilter(request, response);

        if (!properties.getAudit().isEnabled()) {
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = "anonymous";
        if (authentication != null && authentication.getPrincipal() instanceof UserEntity user) {
            userId = user.getId().toString();
        }

        AuditLogEntry entry = AuditLogEntry.builder()
                .userId(userId)
                .action("HTTP_REQUEST")
                .resource("API")
                .endpoint(request.getRequestURI())
                .method(request.getMethod())
                .timestamp(Instant.now().toString())
                .status(response.getStatus())
                .ipAddress(resolveClientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .build();

        auditLogService.enqueue(entry);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

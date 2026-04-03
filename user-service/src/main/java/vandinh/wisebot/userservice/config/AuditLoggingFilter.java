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
import vandinh.wisebot.userservice.service.redis.AuditLogEntry;
import vandinh.wisebot.userservice.service.redis.AuditLogService;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "AUDIT_LOG_FILTER")
public class AuditLoggingFilter extends OncePerRequestFilter {

    private final AuditLogService auditLogService;
    private final RedisFeatureProperties properties;

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
                .endpoint(request.getRequestURI())
                .method(request.getMethod())
                .timestamp(Instant.now().toString())
                .status(response.getStatus())
                .build();

        auditLogService.enqueue(entry);
    }
}

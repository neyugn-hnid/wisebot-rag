package vandinh.wisebot.userservice.config;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import vandinh.wisebot.userservice.common.enums.TokenType;
import vandinh.wisebot.userservice.common.response.ErrorResponse;
import vandinh.wisebot.userservice.service.JwtService;
import vandinh.wisebot.userservice.service.UserServiceDetail;
import vandinh.wisebot.userservice.service.redis.JwtBlacklistService;

import java.io.IOException;
import java.util.Date;
import java.util.UUID;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "JWT_AUTH_FILTER")
@Order(1)
public class JWTAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final JwtBlacklistService jwtBlacklistService;
    private final UserServiceDetail serviceDetail;
    private final ObjectMapper objectMapper;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    // Whitelist: bypass filter
    private static final String[] AUTH_WHITELIST = {
            "/user/auth/**",
            "/swagger-ui/**",
            "/v3/**",
            "/webjars/**",
            "/favicon.ico",
            "/actuator/**"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        for (String pattern : AUTH_WHITELIST) {
            if (pathMatcher.match(pattern, path)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        final String authHeader = request.getHeader(AUTHORIZATION);

        if (!StringUtils.hasLength(authHeader) || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        try {
            if (jwtBlacklistService.isBlacklisted(token)) {
                writeErrorResponse(response, request.getRequestURI(), "Token has been revoked");
                return;
            }

            UUID userId = jwtService.extractUserId(token, TokenType.ACCESS_TOKEN);
            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails user = serviceDetail.loadUserById(userId);

                if (jwtService.isTokenValid(token, user)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContext context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(authToken);
                    SecurityContextHolder.setContext(context);
                }
            }
        } catch (Exception e) {
            log.error("JWT filter error: {}", e.getMessage());
            writeErrorResponse(response, request.getRequestURI(), e.getMessage());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeErrorResponse(HttpServletResponse response, String path, String message) throws IOException {
        ErrorResponse error = new ErrorResponse();
        error.setTimestamp(new Date());
        error.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        error.setPath(path);
        error.setError("Unauthorized");
        error.setMessage(message);

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), error);
    }
}

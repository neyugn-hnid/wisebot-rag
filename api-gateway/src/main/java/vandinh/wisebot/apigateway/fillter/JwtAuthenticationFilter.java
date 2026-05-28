package vandinh.wisebot.apigateway.fillter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Component
@Slf4j(topic = "JWT_AUTH_FILTER")
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    // Whitelist: bypass filter
    private static final String[] AUTH_WHITELIST = {
            "/auth/**",
            "/api/auth/**",
            "/swagger-ui/**",
            "/v3/**",
            "/webjars/**",
            "/favicon.ico",
            "/actuator/**",
            "/api/user/avatars/**",
            "/user/avatars/**"
    };

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    public static class Config {
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getURI().getPath();

            for (String pattern : AUTH_WHITELIST) {
                if (pathMatcher.match(pattern, path)) {
                    return chain.filter(exchange);
                }
            }

            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
                log.warn("Thiếu hoặc sai header Authorization tại path: {}", path);
                return unauthorized(exchange, "Thiếu hoặc sai header Authorization");
            }

            String token = authHeader.substring(7);

            try {
                Claims claims = parseClaims(token);
                if (isExpired(claims)) {
                    return unauthorized(exchange, "Token đã hết hạn");
                }
                log.debug("JWT token đã được xác thực cho path: {}", path);
                
                String userId = claims.get("userId", String.class);
                String tenantId = claims.get("tenantId", String.class);
                Object roleObj = claims.get("role");
                String roles = "";
                if (roleObj instanceof java.util.List) {
                    roles = String.join(",", (java.util.List<String>) roleObj);
                } else if (roleObj instanceof String) {
                    roles = (String) roleObj;
                }

                org.springframework.http.server.reactive.ServerHttpRequest mutatedRequest = exchange.getRequest()
                        .mutate()
                        .header("X-User-Id", userId)
                        .header("X-Tenant-Id", tenantId == null ? "" : tenantId)
                        .header("X-User-Roles", roles)
                        .build();
                
                ServerWebExchange mutatedExchange = exchange.mutate().request(mutatedRequest).build();
                return chain.filter(mutatedExchange);
            } catch (ExpiredJwtException e) {
                log.warn("JWT đã hết hạn tại path {}: {}", path, e.getMessage());
                return unauthorized(exchange, "Token đã hết hạn");
            } catch (JwtException e) {
                log.warn("JWT không hợp lệ tại path {}: {}", path, e.getMessage());
                return unauthorized(exchange, "Token không hợp lệ");
            } catch (Exception e) {
                log.error("Lỗi filter JWT tại path {}: {}", path, e.getMessage());
                return unauthorized(exchange, "Lỗi xác thực token");
            }
        };
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (IllegalArgumentException ex) {
            keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private boolean isExpired(Claims claims) {
        Date expiration = claims.getExpiration();
        if (expiration == null) {
            return false;
        }
        return expiration.toInstant().isBefore(Instant.now());
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"error\":\"" + message + "\"}";
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }
}


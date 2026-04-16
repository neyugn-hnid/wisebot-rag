package vandinh.wisebot.chatservice.security;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class WebSocketUserHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        String userId = request.getHeaders().getFirst("X-User-Id");
        String userRoles = request.getHeaders().getFirst("X-User-Roles");

        if (!StringUtils.hasText(userId) || !StringUtils.hasText(userRoles)) {
            return false;
        }

        attributes.put("X-User-Id", userId);
        attributes.put("X-User-Roles", userRoles);
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // no-op
    }
}

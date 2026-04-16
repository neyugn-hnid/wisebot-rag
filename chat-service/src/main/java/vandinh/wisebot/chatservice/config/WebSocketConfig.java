package vandinh.wisebot.chatservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import vandinh.wisebot.chatservice.security.WebSocketAuthChannelInterceptor;
import vandinh.wisebot.chatservice.security.WebSocketUserHandshakeInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketUserHandshakeInterceptor handshakeInterceptor;
    private final WebSocketAuthChannelInterceptor authChannelInterceptor;

    public WebSocketConfig(
            WebSocketUserHandshakeInterceptor handshakeInterceptor,
            WebSocketAuthChannelInterceptor authChannelInterceptor
    ) {
        this.handshakeInterceptor = handshakeInterceptor;
        this.authChannelInterceptor = authChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*");
        registry.addEndpoint("/ws/chat")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }
}

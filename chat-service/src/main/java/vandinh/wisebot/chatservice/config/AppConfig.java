package vandinh.wisebot.chatservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
@EnableConfigurationProperties({AiClientProperties.class, EmbeddingClientProperties.class, DocumentClientProperties.class})
public class AppConfig {

    @Value("${jwt.secret:change-me}")
    private String jwtSecret;

    @Value("${spring.application.name:chat-service}")
    private String serviceSubject;

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        ClientHttpRequestInterceptor interceptor = (request, body, execution) -> {
            boolean needsServiceAuth = request.getURI().getPath().startsWith("/v1/");
            boolean missingAuthorization = !request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION);

            if (needsServiceAuth && missingAuthorization) {
                request.getHeaders().setBearerAuth(generateServiceToken());
            }

            return execution.execute(request, body);
        };
        restTemplate.getInterceptors().add(interceptor);
        return restTemplate;
    }

    private String generateServiceToken() {
        try {
            long now = System.currentTimeMillis() / 1000;
            String header = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
            String payload = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString((
                            "{\"sub\":\"" + serviceSubject + "\",\"iss\":\"wisebot\",\"iat\":" + now +
                                    ",\"exp\":" + (now + 60) + "}"
                    ).getBytes(StandardCharsets.UTF_8));

            String message = header + "." + payload;
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            String signature = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(sha256Hmac.doFinal(message.getBytes(StandardCharsets.UTF_8)));

            return message + "." + signature;
        } catch (Exception ex) {
            throw new IllegalStateException("Tạo token dịch vụ thất bại", ex);
        }
    }
}

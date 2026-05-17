package vandinh.wisebot.documentservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;

@Configuration
@EnableConfigurationProperties(BillingProperties.class)
public class AppConfig {

    @Value("${SERVICE_JWT_SECRET:${jwt.secret:change-me}}")
    private String serviceJwtSecret;

    @Value("${SERVICE_JWT_AUDIENCE:}")
    private String serviceJwtAudience;

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        
        ClientHttpRequestInterceptor interceptor = (request, body, execution) -> {
            if (request.getURI().getPath().startsWith("/embed") || 
                request.getURI().getPath().startsWith("/v1/")) {
                
                try {
                    String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
                    String audienceClaim = serviceJwtAudience != null && !serviceJwtAudience.isBlank()
                            ? ",\"aud\":\"" + serviceJwtAudience + "\""
                            : "";
                    String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                            ("{\"sub\":\"document-service\",\"iss\":\"wisebot\",\"iat\":" + (System.currentTimeMillis() / 1000) +
                            ",\"exp\":" + ((System.currentTimeMillis() / 1000) + 60) + audienceClaim + "}").getBytes(StandardCharsets.UTF_8)
                    );
                    
                    String message = header + "." + payload;
                    Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
                    SecretKeySpec secret_key = new SecretKeySpec(serviceJwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
                    sha256_HMAC.init(secret_key);
                    String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(sha256_HMAC.doFinal(message.getBytes(StandardCharsets.UTF_8)));
                    
                    String token = message + "." + signature;
                    request.getHeaders().add("Authorization", "Bearer " + token);
                } catch (Exception e) {
                    // Ignore and let it fail at embedding-service
                }
            }
            return execution.execute(request, body);
        };
        
        restTemplate.getInterceptors().add(interceptor);
        return restTemplate;
    }
}

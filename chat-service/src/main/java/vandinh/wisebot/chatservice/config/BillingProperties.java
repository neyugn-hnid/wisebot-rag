package vandinh.wisebot.chatservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "billing")
public class BillingProperties {
    private String baseUrl = "http://localhost:8085";
    private String internalApiKey = "wisebot-internal-key";
}

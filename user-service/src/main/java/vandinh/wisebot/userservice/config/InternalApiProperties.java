package vandinh.wisebot.userservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.internal")
public class InternalApiProperties {
    private String apiKey = "change-me";
}

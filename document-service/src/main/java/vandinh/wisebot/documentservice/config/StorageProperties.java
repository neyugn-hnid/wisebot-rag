package vandinh.wisebot.documentservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {
    private boolean enabled = false;
    private String basePath = "./data/uploads";
}

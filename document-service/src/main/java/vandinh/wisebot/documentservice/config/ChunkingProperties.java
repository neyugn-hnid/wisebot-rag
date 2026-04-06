package vandinh.wisebot.documentservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "chunking")
public class ChunkingProperties {
    private int chunkSize = 800;
    private int overlap = 120;
}

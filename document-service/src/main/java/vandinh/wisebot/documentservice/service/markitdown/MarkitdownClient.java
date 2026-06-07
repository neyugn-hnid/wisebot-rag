package vandinh.wisebot.documentservice.service.markitdown;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.documentservice.config.MarkitdownProperties;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "markitdown.enabled", havingValue = "true", matchIfMissing = false)
public class MarkitdownClient {

    private final RestTemplate restTemplate;
    private final MarkitdownProperties properties;

    public MarkitdownResult parse(byte[] fileContent, String filename) {
        if (!properties.isEnabled() || fileContent == null || fileContent.length == 0) {
            return null;
        }

        String url = properties.getBaseUrl() + properties.getParsePath();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(fileContent) {
            @Override
            public String getFilename() {
                return filename;
            }
        });

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            Object markdown = response.getBody() != null ? response.getBody().get("markdown") : null;
            if (markdown instanceof String text && !text.isBlank()) {
                MarkitdownResult result = new MarkitdownResult();
                result.setMarkdown(text);
                return result;
            }
        } catch (Exception e) {
            log.warn("MarkItDown parse failed for {}: {}", filename, e.getMessage());
        }

        return null;
    }

    @Data
    public static class MarkitdownResult {
        private String markdown;

        public boolean hasContent() {
            return markdown != null && !markdown.isBlank();
        }
    }
}

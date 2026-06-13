package vandinh.wisebot.documentservice.service.kreuzberg;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * HTTP client gọi kreuzberg-service (Python, full Kreuzberg features).
 * Trả về text + chunks (markdown-aware, token-based) từ Rust core.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KreuzbergClient {

    private final RestTemplate restTemplate;

    public KreuzbergResult parse(byte[] fileContent, String filename, String contentType) {
        if (fileContent == null || fileContent.length == 0) {
            return null;
        }

        String url = "http://kreuzberg-service:8006/parse";

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
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

            if (response.getBody() == null) return null;

            Map<String, Object> resp = response.getBody();
            KreuzbergResult result = new KreuzbergResult();
            result.setText((String) resp.get("text"));

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawChunks = (List<Map<String, Object>>) resp.get("chunks");
            if (rawChunks != null) {
                List<KreuzbergChunk> chunks = new ArrayList<>();
                for (Map<String, Object> c : rawChunks) {
                    chunks.add(KreuzbergChunk.builder()
                            .content((String) c.get("content"))
                            .build());
                }
                result.setChunks(chunks);
            }
            return result;
        } catch (Exception e) {
            log.error("Kreuzberg HTTP parse failed for {}: {}", filename, e.getMessage());
            return null;
        }
    }

    @Data
    public static class KreuzbergResult {
        private String text;
        private List<KreuzbergChunk> chunks;

        public boolean hasContent() {
            return text != null && !text.isBlank();
        }
    }

    @Data
    @Builder
    public static class KreuzbergChunk {
        private String content;
    }
}

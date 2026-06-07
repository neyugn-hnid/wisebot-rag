package vandinh.wisebot.documentservice.service.mineru;

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
import vandinh.wisebot.documentservice.config.MineruProperties;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "mineru.enabled", havingValue = "true", matchIfMissing = false)
public class MineruClient {

    private final RestTemplate restTemplate;
    private final MineruProperties properties;

    public MineruResult parse(byte[] fileContent, String filename) {
        if (!properties.isEnabled() || fileContent == null || fileContent.length == 0) {
            return null;
        }

        try {
            MineruResult result = parseFile(fileContent, filename);
            if (result == null) {
                log.warn("MinerU returned no parse result for: {}", filename);
                return null;
            }

            log.info("MinerU parse done for {}", filename);
            return result;
        } catch (Exception e) {
            log.error("MinerU parse failed for {}: {}", filename, e.getMessage());
            return null;
        }
    }

    private MineruResult parseFile(byte[] fileContent, String filename) {
        String url = properties.getBaseUrl() + properties.getFileParsePath();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("files", new ByteArrayResource(fileContent) {
            @Override
            public String getFilename() {
                return filename;
            }
        });
        body.add("backend", properties.getBackend());
        body.add("parse_method", properties.getParseMethod());
        body.add("lang_list", properties.getLang());
        body.add("return_md", "true");
        body.add("return_middle_json", "false");
        body.add("return_model_output", "false");
        body.add("return_content_list", "false");
        body.add("return_images", "false");
        body.add("response_format_zip", "false");
        body.add("return_original_file", "false");
        body.add("image_analysis", "false");

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            return resp.getBody() != null ? parseResult(resp.getBody()) : null;
        } catch (Exception e) {
            log.error("MinerU file_parse request failed: {}", e.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private MineruResult parseResult(Map<String, Object> response) {
        MineruResult result = new MineruResult();
        result.setMarkdown(findMarkdown(response).orElse(null));

        if (response.get("results") instanceof Map<?, ?> results) {
            result.setMetadata((Map<String, Object>) results);
            result.setPageCount(results.size());
        }

        return result;
    }

    private Optional<String> findMarkdown(Object value) {
        if (value instanceof String text) {
            return Optional.of(text).filter(s -> !s.isBlank());
        }
        if (!(value instanceof Map<?, ?> map)) {
            return Optional.empty();
        }

        for (String key : new String[]{"md_content", "markdown", "content"}) {
            Object candidate = map.get(key);
            if (candidate instanceof String text && !text.isBlank()) {
                return Optional.of(text);
            }
        }

        for (Object child : map.values()) {
            Optional<String> markdown = findMarkdown(child);
            if (markdown.isPresent()) {
                return markdown;
            }
        }

        return Optional.empty();
    }

    @lombok.Data
    public static class MineruResult {
        private String markdown;
        private int pageCount;
        private Map<String, Object> metadata = new HashMap<>();

        public boolean hasContent() {
            return markdown != null && !markdown.isBlank();
        }
    }
}

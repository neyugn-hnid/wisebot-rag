package vandinh.wisebot.documentservice.service.mineru;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.documentservice.config.MineruProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * REST client cho MinerU document parsing API.
 *
 * Flow: upload file → poll task → lấy Markdown kết quả
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "mineru.enabled", havingValue = "true", matchIfMissing = false)
public class MineruClient {

    private final RestTemplate restTemplate;
    private final MineruProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * Upload và parse file, chờ kết quả.
     * Trả về Markdown + metadata, hoặc null nếu thất bại.
     */
    public MineruResult parse(byte[] fileContent, String filename) {
        if (!properties.isEnabled() || fileContent == null || fileContent.length == 0) {
            return null;
        }

        try {
            String taskId = uploadFile(fileContent, filename);
            if (taskId == null) {
                log.warn("MinerU upload returned no task_id for: {}", filename);
                return null;
            }
            log.info("MinerU task {} created for: {}", taskId, filename);

            MineruResult result = pollTask(taskId);
            if (result == null) {
                log.warn("MinerU task {} did not complete", taskId);
                return null;
            }

            log.info("MinerU parse done for {} (task: {})", filename, taskId);
            return result;

        } catch (Exception e) {
            log.error("MinerU parse failed for {}: {}", filename, e.getMessage());
            return null;
        }
    }

    private String uploadFile(byte[] fileContent, String filename) {
        String url = properties.getBaseUrl() + properties.getUploadPath();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(fileContent) {
            @Override
            public String getFilename() {
                return filename;
            }
        });
        body.add("parse_type", "auto");

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (resp.getBody() != null) {
                Object rawId = resp.getBody().get("task_id");
                return rawId != null ? rawId.toString() : null;
            }
        } catch (Exception e) {
            log.error("MinerU upload request failed: {}", e.getMessage());
        }
        return null;
    }

    private MineruResult pollTask(String taskId) {
        String url = properties.getBaseUrl() + properties.getTaskPath() + "/" + taskId;
        long deadline = System.currentTimeMillis() + properties.getMaxPollTimeMs();

        while (System.currentTimeMillis() < deadline) {
            try {
                ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
                if (resp.getBody() == null) {
                    Thread.sleep(properties.getPollIntervalMs());
                    continue;
                }

                String status = (String) resp.getBody().getOrDefault("status", "");
                log.debug("MinerU task {} status: {}", taskId, status);

                if ("done".equalsIgnoreCase(status) || "success".equalsIgnoreCase(status)) {
                    return parseResult(resp.getBody());
                }
                if ("failed".equalsIgnoreCase(status) || "error".equalsIgnoreCase(status)) {
                    log.error("MinerU task {} failed: {}", taskId, resp.getBody().get("error"));
                    return null;
                }

                Thread.sleep(properties.getPollIntervalMs());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return null;
            } catch (Exception e) {
                log.warn("MinerU poll failed for task {}: {}", taskId, e.getMessage());
                return null;
            }
        }

        log.warn("MinerU task {} timed out", taskId);
        return null;
    }

    @SuppressWarnings("unchecked")
    private MineruResult parseResult(Map<String, Object> taskResponse) {
        MineruResult result = new MineruResult();
        Object resultObj = taskResponse.get("result");

        if (resultObj instanceof Map<?, ?> rm) {
            Object md = rm.get("markdown");
            if (md instanceof String) {
                result.setMarkdown((String) md);
            } else if (rm.get("content") instanceof String) {
                result.setMarkdown((String) rm.get("content"));
            }
            if (rm.get("metadata") instanceof Map<?, ?>) {
                result.setMetadata((Map<String, Object>) rm.get("metadata"));
            }
            if (rm.get("pages") instanceof Number n) {
                result.setPageCount(n.intValue());
            }
        }

        if (result.getMarkdown() == null && taskResponse.containsKey("markdown")) {
            result.setMarkdown((String) taskResponse.get("markdown"));
        }

        return result;
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

package vandinh.wisebot.chatservice.service.client;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.chatservice.config.EmbeddingClientProperties;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmbeddingSearchClient {

    private final RestTemplate restTemplate;
    private final EmbeddingClientProperties properties;

    @SuppressWarnings("unchecked")
    public Map<String, Object> search(Map<String, Object> payload) {
        String url = properties.getBaseUrl() + properties.getSearchPath();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (properties.getServiceToken() != null && !properties.getServiceToken().isBlank()) {
            headers.setBearerAuth(properties.getServiceToken().trim());
        }

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(payload, headers),
                Map.class
        );

        return response.getBody();
    }
}

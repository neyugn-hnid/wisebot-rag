package vandinh.wisebot.documentservice.service.embedding;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.documentservice.config.EmbeddingProperties;
import vandinh.wisebot.documentservice.dto.request.EmbeddingRequest;
import vandinh.wisebot.documentservice.dto.response.EmbeddingResponse;
import vandinh.wisebot.documentservice.exception.InvalidDataException;

@Service
public class EmbeddingClient {

    private final RestTemplate restTemplate;
    private final EmbeddingProperties properties;

    public EmbeddingClient(RestTemplate restTemplate, EmbeddingProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public EmbeddingResponse embed(EmbeddingRequest request) {
        String url = properties.getBaseUrl() + properties.getPath();
        try {
            ResponseEntity<EmbeddingResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(request),
                    EmbeddingResponse.class
            );
            return response.getBody();
        } catch (Exception e) {
            throw new InvalidDataException("Embedding request failed: " + e.getMessage());
        }
    }
}

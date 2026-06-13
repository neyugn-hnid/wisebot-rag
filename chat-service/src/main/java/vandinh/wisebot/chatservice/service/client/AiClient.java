package vandinh.wisebot.chatservice.service.client;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import vandinh.wisebot.chatservice.config.AiClientProperties;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class AiClient {

    private final RestTemplate restTemplate;
    private final AiClientProperties properties;
    private final ObjectMapper objectMapper;

    public void streamAsk(Map<String, Object> payload, Consumer<Map<String, Object>> onEvent) {
        String url = properties.getBaseUrl() + properties.getStreamPath();

        restTemplate.execute(
                url,
                HttpMethod.POST,
                request -> {
                    request.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                    request.getHeaders().setAccept(java.util.List.of(MediaType.TEXT_EVENT_STREAM));
                    if (properties.getServiceToken() != null && !properties.getServiceToken().isBlank()) {
                        request.getHeaders().setBearerAuth(properties.getServiceToken().trim());
                    }
                    objectMapper.writeValue(request.getBody(), payload);
                },
                response -> {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(response.getBody(), StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (!line.startsWith("data:")) {
                                continue;
                            }
                            String data = line.substring(5).trim();
                            if (data.isBlank()) {
                                continue;
                            }
                            Map<String, Object> event = objectMapper.readValue(
                                    data,
                                    new TypeReference<Map<String, Object>>() {
                                    }
                            );
                            onEvent.accept(event);
                        }
                    } catch (IOException ex) {
                        throw new IllegalStateException("Failed to consume AI stream", ex);
                    }
                    return null;
                }
        );
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getProviderInfo() {
        String url = properties.getBaseUrl() + properties.getProviderPath();
        HttpHeaders headers = new HttpHeaders();
        if (properties.getServiceToken() != null && !properties.getServiceToken().isBlank()) {
            headers.setBearerAuth(properties.getServiceToken().trim());
        }

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );
        return response.getBody();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> updateProviderMode(String mode) {
        String url = properties.getBaseUrl() + properties.getProviderPath();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (properties.getServiceToken() != null && !properties.getServiceToken().isBlank()) {
            headers.setBearerAuth(properties.getServiceToken().trim());
        }

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                new HttpEntity<>(Map.of("mode", mode), headers),
                Map.class
        );
        return response.getBody();
    }
}

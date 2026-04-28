package vandinh.wisebot.chatservice.service.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.chatservice.common.response.ApiResponse;
import vandinh.wisebot.chatservice.config.DocumentClientProperties;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentKnowledgeBaseClient {

    private final RestTemplate restTemplate;
    private final DocumentClientProperties properties;
    private final ObjectMapper objectMapper;

    public List<KnowledgeBaseItem> listKnowledgeBases() {
        String url = properties.getBaseUrl() + properties.getKnowledgeBasesPath();
        HttpHeaders headers = new HttpHeaders();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            if (principal != null) {
                headers.add("X-User-Id", principal.toString());
            }
            Collection<String> roles = authentication.getAuthorities().stream()
                    .map(granted -> granted.getAuthority())
                    .toList();
            if (!roles.isEmpty()) {
                headers.add("X-User-Roles", String.join(",", roles));
            }
            Object details = authentication.getDetails();
            if (details instanceof java.util.Map<?, ?> detailMap) {
                Object tenantId = detailMap.get("tenantId");
                if (tenantId instanceof String tenantIdStr && !tenantIdStr.isBlank()) {
                    headers.add("X-Tenant-Id", tenantIdStr);
                }
            }
        }

        ResponseEntity<ApiResponse> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {
                }
        );

        Object data = response.getBody() == null ? null : response.getBody().getData();
        if (data == null) {
            return List.of();
        }

        return objectMapper.convertValue(data, objectMapper.getTypeFactory()
                .constructCollectionType(List.class, KnowledgeBaseItem.class));
    }

    public record KnowledgeBaseItem(UUID id, UUID tenantId, String name) {
    }
}

package vandinh.wisebot.chatservice.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.chatservice.config.WidgetProperties;
import vandinh.wisebot.chatservice.dto.request.RecommendRequest;
import vandinh.wisebot.chatservice.dto.response.RecommendResponse;
import vandinh.wisebot.chatservice.dto.response.ProductItem;
import vandinh.wisebot.chatservice.service.client.AiClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/public/api/v1")
@RequiredArgsConstructor
public class PublicApiController {

    private final AiClient aiClient;
    private final WidgetProperties widgetProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @PostMapping("/recommend")
    public ResponseEntity<?> recommend(
            @RequestHeader("X-API-Key") String apiKey,
            @Valid @RequestBody RecommendRequest request
    ) {
        // 1. Validate API key via widget-service
        Map<String, Object> widgetData;
        try {
            var headers = new org.springframework.http.HttpHeaders();
            headers.set("X-API-Key", apiKey);
            var entity = new org.springframework.http.HttpEntity<>(null, headers);
            var response = restTemplate.postForEntity(
                    widgetProperties.getBaseUrl() + "/internal/api-keys/validate",
                    entity,
                    Map.class
            );
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid API key"));
            }
            widgetData = response.getBody();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid API key: " + e.getMessage()));
        }

        // 2. Extract widget info
        Map<String, Object> data = (Map<String, Object>) widgetData.get("data");
        if (data == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid API key"));
        }
        UUID tenantId = UUID.fromString(data.get("tenantId").toString());
        String knowledgeBaseIdStr = null;
        Map<String, Object> appearanceConfig = (Map<String, Object>) data.get("appearanceConfig");
        if (appearanceConfig != null && appearanceConfig.get("knowledgeBaseId") != null) {
            knowledgeBaseIdStr = appearanceConfig.get("knowledgeBaseId").toString();
        }

        // 3. Call AI service
        Map<String, Object> aiPayload = new HashMap<>();
        aiPayload.put("tenant_id", tenantId);
        aiPayload.put("question", request.getQuestion());
        aiPayload.put("top_k", request.getTopK());
        aiPayload.put("temperature", request.getTemperature());
        if (knowledgeBaseIdStr != null) {
            aiPayload.put("knowledge_base_id", UUID.fromString(knowledgeBaseIdStr));
        }
        aiPayload.put("page_context", request.getPageContext());

        Map<String, Object> aiResult = aiClient.ask(aiPayload);
        String answer = (String) aiResult.getOrDefault("answer", "");

        // 4. Parse JSON products from answer
        return ResponseEntity.ok(parseRecommendResponse(answer));
    }

    private Map<String, Object> parseRecommendResponse(String answer) {
        var result = new HashMap<String, Object>();

        // Try to extract JSON products
        var jsonMatch = java.util.regex.Pattern.compile(
                "__JSON_PRODUCTS__\\s*([\\s\\S]*?)\\s*__END_JSON__"
        ).matcher(answer);
        if (jsonMatch.find()) {
            try {
                List<ProductItem> products = objectMapper.readValue(
                        jsonMatch.group(1),
                        new TypeReference<List<ProductItem>>() {}
                );
                String message = answer.replaceAll(
                        "__JSON_PRODUCTS__[\\s\\S]*?__END_JSON__", ""
                ).trim();
                result.put("message", message);
                result.put("products", products);
                return result;
            } catch (Exception ignored) {
                // Fall through to text-only response
            }
        }

        // No JSON found - return as plain text
        result.put("message", answer);
        result.put("products", List.of());
        return result;
    }
}

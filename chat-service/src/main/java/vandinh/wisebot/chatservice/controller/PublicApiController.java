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
import vandinh.wisebot.chatservice.dto.request.AskRequest;
import vandinh.wisebot.chatservice.dto.request.RecommendRequest;
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

    @PostMapping("/ask")
    public ResponseEntity<?> ask(
            @RequestHeader("X-API-Key") String apiKey,
            @Valid @RequestBody AskRequest request
    ) {
        WidgetContext context = validateApiKey(apiKey);
        if (!context.valid()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", context.error()));
        }

        UUID knowledgeBaseId = resolveKnowledgeBaseId(request.getKnowledgeBaseId(), context.widgetData());

        Map<String, Object> aiPayload = new HashMap<>();
        aiPayload.put("tenant_id", context.tenantId());
        aiPayload.put("question", request.getQuestion());
        aiPayload.put("top_k", request.getTopK());
        aiPayload.put("temperature", request.getTemperature());
        if (knowledgeBaseId != null) {
            aiPayload.put("knowledge_base_id", knowledgeBaseId);
        }
        if (request.getPageContext() != null) {
            aiPayload.put("page_context", request.getPageContext());
        }

        Map<String, Object> aiResult = aiClient.ask(aiPayload);
        String answer = aiResult == null || aiResult.get("answer") == null
                ? ""
                : aiResult.get("answer").toString();
        Object citations = aiResult == null || aiResult.get("citations") == null
                ? List.of()
                : aiResult.get("citations");
        return ResponseEntity.ok(Map.of(
                "answer", answer,
                "citations", citations
        ));
    }

    @PostMapping("/recommend")
    public ResponseEntity<?> recommend(
            @RequestHeader("X-API-Key") String apiKey,
            @Valid @RequestBody RecommendRequest request
    ) {
        WidgetContext context = validateApiKey(apiKey);
        if (!context.valid()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", context.error()));
        }

        UUID knowledgeBaseId = resolveKnowledgeBaseId(request.getKnowledgeBaseId(), context.widgetData());

        Map<String, Object> aiPayload = new HashMap<>();
        aiPayload.put("tenant_id", context.tenantId());
        aiPayload.put("question", request.getQuestion());
        aiPayload.put("top_k", request.getTopK());
        aiPayload.put("temperature", request.getTemperature());
        if (knowledgeBaseId != null) {
            aiPayload.put("knowledge_base_id", knowledgeBaseId);
        }
        Map<String, Object> pageContext = new HashMap<>();
        if (request.getPageContext() != null) {
            pageContext.putAll(request.getPageContext());
        }
        pageContext.put("recommendMode", true);
        aiPayload.put("page_context", pageContext);

        Map<String, Object> aiResult = aiClient.ask(aiPayload);
        String answer = (String) aiResult.getOrDefault("answer", "");

        return ResponseEntity.ok(parseRecommendResponse(answer));
    }

    @SuppressWarnings("unchecked")
    private WidgetContext validateApiKey(String apiKey) {
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
                return WidgetContext.invalid("Invalid API key");
            }

            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            if (data == null || data.get("tenantId") == null) {
                return WidgetContext.invalid("Invalid API key");
            }

            return WidgetContext.valid(UUID.fromString(data.get("tenantId").toString()), data);
        } catch (Exception e) {
            return WidgetContext.invalid("Invalid API key: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private UUID resolveKnowledgeBaseId(UUID requestKnowledgeBaseId, Map<String, Object> widgetData) {
        if (requestKnowledgeBaseId != null) {
            return requestKnowledgeBaseId;
        }

        Map<String, Object> appearanceConfig = (Map<String, Object>) widgetData.get("appearanceConfig");
        if (appearanceConfig != null && appearanceConfig.get("knowledgeBaseId") != null) {
            return UUID.fromString(appearanceConfig.get("knowledgeBaseId").toString());
        }

        return null;
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

    private record WidgetContext(boolean valid, UUID tenantId, Map<String, Object> widgetData, String error) {
        private static WidgetContext valid(UUID tenantId, Map<String, Object> widgetData) {
            return new WidgetContext(true, tenantId, widgetData, null);
        }

        private static WidgetContext invalid(String error) {
            return new WidgetContext(false, null, Map.of(), error);
        }
    }
}

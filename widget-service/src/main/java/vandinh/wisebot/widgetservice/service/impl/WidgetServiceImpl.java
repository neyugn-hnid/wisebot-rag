package vandinh.wisebot.widgetservice.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.widgetservice.dto.WidgetAppearanceConfig;
import vandinh.wisebot.widgetservice.dto.request.AddDomainRequest;
import vandinh.wisebot.widgetservice.dto.request.CreateApiKeyRequest;
import vandinh.wisebot.widgetservice.dto.request.CreateWidgetSessionRequest;
import vandinh.wisebot.widgetservice.dto.request.CreateWidgetRequest;
import vandinh.wisebot.widgetservice.dto.request.TrackEventRequest;
import vandinh.wisebot.widgetservice.dto.request.UpdateWidgetRequest;
import vandinh.wisebot.widgetservice.dto.response.ApiKeyResponse;
import vandinh.wisebot.widgetservice.dto.response.DomainResponse;
import vandinh.wisebot.widgetservice.dto.response.PublicWidgetResponse;
import vandinh.wisebot.widgetservice.dto.response.WidgetEventResponse;
import vandinh.wisebot.widgetservice.dto.response.WidgetResponse;
import vandinh.wisebot.widgetservice.dto.response.WidgetSessionResponse;
import vandinh.wisebot.widgetservice.entity.WidgetAllowedDomain;
import vandinh.wisebot.widgetservice.entity.WidgetApiKey;
import vandinh.wisebot.widgetservice.entity.Widget;
import vandinh.wisebot.widgetservice.entity.WidgetEvent;
import vandinh.wisebot.widgetservice.entity.WidgetSession;
import vandinh.wisebot.widgetservice.exception.InvalidDataException;
import vandinh.wisebot.widgetservice.exception.ResourceNotFoundException;
import vandinh.wisebot.widgetservice.repository.WidgetAllowedDomainRepository;
import vandinh.wisebot.widgetservice.repository.WidgetApiKeyRepository;
import vandinh.wisebot.widgetservice.repository.WidgetEventRepository;
import vandinh.wisebot.widgetservice.repository.WidgetRepository;
import vandinh.wisebot.widgetservice.repository.WidgetSessionRepository;
import vandinh.wisebot.widgetservice.service.WidgetService;
import vandinh.wisebot.widgetservice.service.BillingEntitlementService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WidgetServiceImpl implements WidgetService {

    private final WidgetRepository widgetRepository;
    private final WidgetEventRepository eventRepository;
    private final WidgetAllowedDomainRepository domainRepository;
    private final WidgetApiKeyRepository apiKeyRepository;
    private final WidgetSessionRepository sessionRepository;
    private final ObjectMapper objectMapper;
    private final BillingEntitlementService billingEntitlementService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WidgetResponse createWidget(CreateWidgetRequest request) {
        var entitlement = billingEntitlementService.getEntitlements(request.getTenantId());
        Widget widget = Widget.builder()
                .tenantId(request.getTenantId())
                .name(request.getName())
                .code(request.getCode())
                .status("ACTIVE")
                .welcomeMessage(request.getWelcomeMessage())
                .publicConfig(writeAppearanceConfig(sanitizeAppearanceConfig(request.getAppearanceConfig(), entitlement.isWidgetCustomizationEnabled())))
                .privateConfig("{}")
                .createdBy(request.getCreatedBy())
                .build();
        return mapWidget(widgetRepository.save(widget));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WidgetResponse updateWidget(UUID widgetId, UpdateWidgetRequest request) {
        Widget widget = widgetRepository.findById(widgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Widget not found: " + widgetId));
        var entitlement = billingEntitlementService.getEntitlements(widget.getTenantId());

        widget.setName(request.getName());
        widget.setWelcomeMessage(request.getWelcomeMessage());
        widget.setPublicConfig(writeAppearanceConfig(sanitizeAppearanceConfig(request.getAppearanceConfig(), entitlement.isWidgetCustomizationEnabled())));

        return mapWidget(widgetRepository.save(widget));
    }

    @Override
    @Transactional(readOnly = true)
    public PublicWidgetResponse getPublicWidgetByCode(String code) {
        Widget widget = findWidgetByCode(code);
        return PublicWidgetResponse.builder()
                .id(widget.getId())
                .tenantId(widget.getTenantId())
                .code(widget.getCode())
                .name(widget.getName())
                .welcomeMessage(widget.getWelcomeMessage())
                .appearanceConfig(readAppearanceConfig(widget.getPublicConfig()))
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WidgetSessionResponse createPublicSession(String code, CreateWidgetSessionRequest request) {
        Widget widget = findWidgetByCode(code);
        return createSession(widget.getId(), request);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WidgetEventResponse trackPublicEvent(String code, TrackEventRequest request) {
        Widget widget = findWidgetByCode(code);
        return trackEvent(widget.getId(), request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WidgetResponse> listWidgets(UUID tenantId) {
        return widgetRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::mapWidget)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WidgetEventResponse trackEvent(UUID widgetId, TrackEventRequest request) {
        Widget widget = widgetRepository.findById(widgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Widget not found: " + widgetId));

        WidgetEvent event = WidgetEvent.builder()
                .widgetId(widget.getId())
                .tenantId(request.getTenantId())
                .sessionId(request.getSessionId())
                .eventType(request.getEventType())
                .payload(request.getPayload() == null ? "{}" : request.getPayload())
                .build();
        return mapEvent(eventRepository.save(event));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WidgetEventResponse> latestEvents(UUID widgetId) {
        return eventRepository.findTop50ByWidgetIdOrderByCreatedAtDesc(widgetId)
                .stream()
                .map(this::mapEvent)
                .toList();
    }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public DomainResponse addDomain(UUID widgetId, AddDomainRequest request) {
        Widget widget = widgetRepository.findById(widgetId)
            .orElseThrow(() -> new ResourceNotFoundException("Widget not found: " + widgetId));
        WidgetAllowedDomain domain = WidgetAllowedDomain.builder()
            .widget(widget)
            .domain(request.getDomain())
            .allowSubdomains(request.isAllowSubdomains())
            .build();
        return mapDomain(domainRepository.save(domain));
        }

        @Override
        @Transactional(readOnly = true)
        public List<DomainResponse> listDomains(UUID widgetId) {
        return domainRepository.findAllByWidget_Id(widgetId)
            .stream()
            .map(this::mapDomain)
            .toList();
        }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public ApiKeyResponse createApiKey(UUID widgetId, CreateApiKeyRequest request) {
        Widget widget = widgetRepository.findById(widgetId)
            .orElseThrow(() -> new ResourceNotFoundException("Widget not found: " + widgetId));
        var entitlement = billingEntitlementService.getEntitlements(widget.getTenantId());
        if (!entitlement.isApiAccessEnabled()) {
            throw new InvalidDataException("Gói hiện tại chưa hỗ trợ truy cập API. Vui lòng nâng cấp lên gói Plus hoặc Pro.");
        }
        String raw = UUID.randomUUID().toString().replace("-", "");
        String prefix = raw.substring(0, 8);
        String hash = sha256(raw);
        WidgetApiKey key = WidgetApiKey.builder()
            .widget(widget)
            .keyPrefix(prefix)
            .keyHash(hash)
            .name(request.getName() != null ? request.getName() : prefix)
            .status("ACTIVE")
            .expiresAt(request.getExpiresAt())
            .build();
        apiKeyRepository.save(key);

        // Return raw key only once (client must save it)
        return ApiKeyResponse.builder()
            .id(key.getId())
            .widgetId(widgetId)
            .keyPrefix(prefix)
            .keyHash(raw)  // Return raw key so client can copy it
            .name(key.getName())
            .status(key.getStatus())
            .expiresAt(key.getExpiresAt())
            .createdAt(key.getCreatedAt())
            .build();
        }

        @Override
        @Transactional(readOnly = true)
        public WidgetResponse validateApiKey(String rawApiKey) {
        if (rawApiKey == null || rawApiKey.isBlank()) {
            throw new InvalidDataException("API key is required");
        }
        String hash = sha256(rawApiKey.trim());
        WidgetApiKey apiKey = apiKeyRepository.findByKeyHash(hash)
            .orElseThrow(() -> new InvalidDataException("Invalid API key"));

        if (!"ACTIVE".equals(apiKey.getStatus())) {
            throw new InvalidDataException("API key is not active");
        }
        if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidDataException("API key has expired");
        }

        // Update last used
        apiKey.setLastUsedAt(LocalDateTime.now());
        apiKeyRepository.save(apiKey);

        return mapWidget(apiKey.getWidget());
        }

        @Override
        @Transactional(readOnly = true)
        public List<ApiKeyResponse> listApiKeys(UUID widgetId) {
        return apiKeyRepository.findAllByWidget_IdOrderByCreatedAtDesc(widgetId)
            .stream()
            .map(this::mapApiKey)
            .toList();
        }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public WidgetSessionResponse createSession(UUID widgetId, CreateWidgetSessionRequest request) {
        Widget widget = widgetRepository.findById(widgetId)
            .orElseThrow(() -> new ResourceNotFoundException("Widget not found: " + widgetId));
        WidgetSession session = WidgetSession.builder()
            .widget(widget)
            .tenantId(request.getTenantId())
            .visitorId(request.getVisitorId())
            .userId(request.getUserId())
            .sourceUrl(request.getSourceUrl())
            .referrerUrl(request.getReferrerUrl())
            .ipAddress(request.getIpAddress())
            .userAgent(request.getUserAgent())
            .build();
        return mapSession(sessionRepository.save(session));
        }

        @Override
        @Transactional(readOnly = true)
        public List<WidgetSessionResponse> listSessions(UUID widgetId) {
        return sessionRepository.findTop100ByWidget_IdOrderByStartedAtDesc(widgetId)
            .stream()
            .map(this::mapSession)
            .toList();
        }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public void endSession(UUID sessionId) {
        WidgetSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Widget session not found: " + sessionId));
        session.setEndedAt(LocalDateTime.now());
        sessionRepository.save(session);
        }

    private WidgetResponse mapWidget(Widget widget) {
        return WidgetResponse.builder()
                .id(widget.getId())
                .tenantId(widget.getTenantId())
                .name(widget.getName())
                .code(widget.getCode())
                .status(widget.getStatus())
                .welcomeMessage(widget.getWelcomeMessage())
                .appearanceConfig(readAppearanceConfig(widget.getPublicConfig()))
                .createdAt(widget.getCreatedAt())
                .build();
    }

    private Widget findWidgetByCode(String code) {
        return widgetRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Widget not found with code: " + code));
    }

    private String writeAppearanceConfig(WidgetAppearanceConfig appearanceConfig) {
        try {
            return objectMapper.writeValueAsString(appearanceConfig == null ? new WidgetAppearanceConfig() : appearanceConfig);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Unable to serialize widget appearance config", exception);
        }
    }

    private WidgetAppearanceConfig readAppearanceConfig(String publicConfig) {
        if (publicConfig == null || publicConfig.isBlank()) {
            return new WidgetAppearanceConfig();
        }

        try {
            return objectMapper.readValue(publicConfig, WidgetAppearanceConfig.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Unable to deserialize widget appearance config", exception);
        }
    }

    private WidgetAppearanceConfig sanitizeAppearanceConfig(WidgetAppearanceConfig appearanceConfig, boolean widgetCustomizationEnabled) {
        WidgetAppearanceConfig sanitized = appearanceConfig == null ? new WidgetAppearanceConfig() : appearanceConfig;
        if (widgetCustomizationEnabled) {
            return sanitized;
        }

        sanitized.setPrimaryColor("#2563EB");
        sanitized.setSelectedIconId("bot");
        sanitized.setCustomIconUrl(null);
        sanitized.setIconColor("#ffffff");
        return sanitized;
    }

    private WidgetEventResponse mapEvent(WidgetEvent event) {
        return WidgetEventResponse.builder()
                .id(event.getId())
                .widgetId(event.getWidgetId())
                .tenantId(event.getTenantId())
                .eventType(event.getEventType())
                .payload(event.getPayload())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private DomainResponse mapDomain(WidgetAllowedDomain domain) {
        return DomainResponse.builder()
                .id(domain.getId())
                .widgetId(domain.getWidget().getId())
                .domain(domain.getDomain())
                .allowSubdomains(domain.isAllowSubdomains())
                .verifiedAt(domain.getVerifiedAt())
                .build();
    }

    private ApiKeyResponse mapApiKey(WidgetApiKey apiKey) {
        return ApiKeyResponse.builder()
                .id(apiKey.getId())
                .widgetId(apiKey.getWidget().getId())
                .keyPrefix(apiKey.getKeyPrefix())
                .keyHash(null)  // Never expose hash
                .name(apiKey.getName())
                .status(apiKey.getStatus())
                .expiresAt(apiKey.getExpiresAt())
                .lastUsedAt(apiKey.getLastUsedAt())
                .createdAt(apiKey.getCreatedAt())
                .build();
    }

    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private WidgetSessionResponse mapSession(WidgetSession session) {
        return WidgetSessionResponse.builder()
                .id(session.getId())
                .widgetId(session.getWidget().getId())
                .tenantId(session.getTenantId())
                .visitorId(session.getVisitorId())
                .userId(session.getUserId())
                .sourceUrl(session.getSourceUrl())
                .referrerUrl(session.getReferrerUrl())
                .ipAddress(session.getIpAddress())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .build();
    }
}

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
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WidgetServiceImpl implements WidgetService {

    private static final String DEVELOPER_API_WIDGET_CODE = "__developer_api__";
    private static final String DEVELOPER_API_WIDGET_NAME = "Developer API";

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
    public PublicWidgetResponse getPublicWidgetByCode(String code, String origin, String referer) {
        Widget widget = findWidgetByCode(code);
        assertWidgetOriginAllowed(widget, origin, referer, null);
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
    public WidgetSessionResponse createPublicSession(String code, CreateWidgetSessionRequest request, String origin, String referer) {
        Widget widget = findWidgetByCode(code);
        assertWidgetOriginAllowed(widget, origin, referer, request.getSourceUrl());
        return createSession(widget.getId(), request);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public WidgetEventResponse trackPublicEvent(String code, TrackEventRequest request, String origin, String referer) {
        Widget widget = findWidgetByCode(code);
        assertWidgetOriginAllowed(widget, origin, referer, null);
        return trackEvent(widget.getId(), request);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isWidgetOriginAllowed(UUID widgetId, String origin, String referer, String sourceUrl) {
        Widget widget = widgetRepository.findById(widgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Widget not found: " + widgetId));
        return isWidgetOriginAllowed(widget, origin, referer, sourceUrl);
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
        public ApiKeyResponse createTenantApiKey(UUID tenantId, CreateApiKeyRequest request) {
        Widget widget = getOrCreateDeveloperApiWidget(tenantId);
        return createApiKey(widget.getId(), request);
        }

        @Override
        @Transactional(readOnly = true)
        public List<ApiKeyResponse> listTenantApiKeys(UUID tenantId) {
        return widgetRepository.findByTenantIdAndCode(tenantId, DEVELOPER_API_WIDGET_CODE)
            .map(widget -> apiKeyRepository.findAllByWidget_IdOrderByCreatedAtDesc(widget.getId())
                .stream()
                .map(this::mapApiKey)
                .toList())
            .orElseGet(List::of);
        }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public void deleteTenantApiKey(UUID tenantId, UUID keyId) {
        WidgetApiKey apiKey = apiKeyRepository.findById(keyId)
            .orElseThrow(() -> new ResourceNotFoundException("API key not found: " + keyId));
        if (!tenantId.equals(apiKey.getWidget().getTenantId())
            || !DEVELOPER_API_WIDGET_CODE.equals(apiKey.getWidget().getCode())) {
            throw new ResourceNotFoundException("API key not found: " + keyId);
        }
        apiKeyRepository.delete(apiKey);
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

    private void assertWidgetOriginAllowed(Widget widget, String origin, String referer, String sourceUrl) {
        if (!isWidgetOriginAllowed(widget, origin, referer, sourceUrl)) {
            throw new InvalidDataException("Domain not allowed for this widget");
        }
    }

    private boolean isWidgetOriginAllowed(Widget widget, String origin, String referer, String sourceUrl) {
        List<WidgetAllowedDomain> allowedDomains = domainRepository.findAllByWidget_Id(widget.getId());
        if (allowedDomains.isEmpty()) {
            return false;
        }

        String requestHost = firstHost(origin, referer, sourceUrl);
        if (requestHost == null || requestHost.isBlank()) {
            return false;
        }

        String normalizedRequestHost = normalizeDomain(requestHost);
        return allowedDomains.stream().anyMatch(domain -> domainMatches(normalizedRequestHost, domain));
    }

    private String firstHost(String... urls) {
        for (String url : urls) {
            String host = extractHost(url);
            if (host != null && !host.isBlank()) {
                return host;
            }
        }
        return null;
    }

    private String extractHost(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();
        try {
            URI uri = URI.create(trimmed.contains("://") ? trimmed : "https://" + trimmed);
            return uri.getHost();
        } catch (IllegalArgumentException ignored) {
            return trimmed;
        }
    }

    private boolean domainMatches(String requestHost, WidgetAllowedDomain domain) {
        String allowedDomain = normalizeDomain(domain.getDomain());
        if (requestHost.equals(allowedDomain)) {
            return true;
        }
        return domain.isAllowSubdomains() && requestHost.endsWith("." + allowedDomain);
    }

    private String normalizeDomain(String domain) {
        String normalized = domain == null ? "" : domain.trim().toLowerCase(Locale.ROOT);
        if (normalized.startsWith("www.")) {
            return normalized.substring(4);
        }
        return normalized;
    }

    private Widget getOrCreateDeveloperApiWidget(UUID tenantId) {
        return widgetRepository.findByTenantIdAndCode(tenantId, DEVELOPER_API_WIDGET_CODE)
                .orElseGet(() -> widgetRepository.save(Widget.builder()
                        .tenantId(tenantId)
                        .name(DEVELOPER_API_WIDGET_NAME)
                        .code(DEVELOPER_API_WIDGET_CODE)
                        .status("ACTIVE")
                        .welcomeMessage("Developer API access")
                        .publicConfig(writeAppearanceConfig(new WidgetAppearanceConfig()))
                        .privateConfig("{}")
                        .build()));
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

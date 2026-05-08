package vandinh.wisebot.widgetservice.service;

import vandinh.wisebot.widgetservice.dto.request.CreateWidgetRequest;
import vandinh.wisebot.widgetservice.dto.request.AddDomainRequest;
import vandinh.wisebot.widgetservice.dto.request.CreateApiKeyRequest;
import vandinh.wisebot.widgetservice.dto.request.CreateWidgetSessionRequest;
import vandinh.wisebot.widgetservice.dto.request.TrackEventRequest;
import vandinh.wisebot.widgetservice.dto.request.UpdateWidgetRequest;
import vandinh.wisebot.widgetservice.dto.response.ApiKeyResponse;
import vandinh.wisebot.widgetservice.dto.response.DomainResponse;
import vandinh.wisebot.widgetservice.dto.response.PublicWidgetResponse;
import vandinh.wisebot.widgetservice.dto.response.WidgetEventResponse;
import vandinh.wisebot.widgetservice.dto.response.WidgetResponse;
import vandinh.wisebot.widgetservice.dto.response.WidgetSessionResponse;

import java.util.List;
import java.util.UUID;

public interface WidgetService {
    WidgetResponse createWidget(CreateWidgetRequest request);

    WidgetResponse updateWidget(UUID widgetId, UpdateWidgetRequest request);

    PublicWidgetResponse getPublicWidgetByCode(String code);

    WidgetSessionResponse createPublicSession(String code, CreateWidgetSessionRequest request);

    WidgetEventResponse trackPublicEvent(String code, TrackEventRequest request);

    List<WidgetResponse> listWidgets(UUID tenantId);

    WidgetEventResponse trackEvent(UUID widgetId, TrackEventRequest request);

    List<WidgetEventResponse> latestEvents(UUID widgetId);

    DomainResponse addDomain(UUID widgetId, AddDomainRequest request);

    List<DomainResponse> listDomains(UUID widgetId);

    ApiKeyResponse createApiKey(UUID widgetId, CreateApiKeyRequest request);

    List<ApiKeyResponse> listApiKeys(UUID widgetId);

    WidgetSessionResponse createSession(UUID widgetId, CreateWidgetSessionRequest request);

    List<WidgetSessionResponse> listSessions(UUID widgetId);

    void endSession(UUID sessionId);
}

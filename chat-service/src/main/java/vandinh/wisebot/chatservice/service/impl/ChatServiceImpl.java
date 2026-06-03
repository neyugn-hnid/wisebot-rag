package vandinh.wisebot.chatservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.chatservice.dto.request.AskRequest;
import vandinh.wisebot.chatservice.dto.request.CreateSessionRequest;
import vandinh.wisebot.chatservice.dto.request.MessageFeedbackRequest;
import vandinh.wisebot.chatservice.dto.request.SendMessageRequest;
import vandinh.wisebot.chatservice.dto.response.AskResponse;
import vandinh.wisebot.chatservice.dto.response.ChatMessageCitationResponse;
import vandinh.wisebot.chatservice.dto.response.ChatMessageResponse;
import vandinh.wisebot.chatservice.dto.response.ChatSessionResponse;
import vandinh.wisebot.chatservice.dto.response.MessageFeedbackResponse;
import vandinh.wisebot.chatservice.entity.ChatMessageCitation;
import vandinh.wisebot.chatservice.entity.ChatMessageFeedback;
import vandinh.wisebot.chatservice.entity.ChatMessage;
import vandinh.wisebot.chatservice.entity.ChatSession;
import vandinh.wisebot.chatservice.exception.ResourceNotFoundException;
import vandinh.wisebot.chatservice.repository.ChatMessageCitationRepository;
import vandinh.wisebot.chatservice.repository.ChatMessageFeedbackRepository;
import vandinh.wisebot.chatservice.repository.ChatMessageRepository;
import vandinh.wisebot.chatservice.repository.ChatSessionRepository;
import vandinh.wisebot.chatservice.exception.InvalidDataException;
import vandinh.wisebot.chatservice.service.BillingEntitlementService;
import vandinh.wisebot.chatservice.service.ChatService;
import vandinh.wisebot.chatservice.service.client.AiClient;
import vandinh.wisebot.chatservice.service.client.DocumentKnowledgeBaseClient;
import vandinh.wisebot.chatservice.service.client.EmbeddingSearchClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatMessageCitationRepository citationRepository;
    private final ChatMessageFeedbackRepository feedbackRepository;
    private final EmbeddingSearchClient embeddingSearchClient;
    private final AiClient aiClient;
    private final DocumentKnowledgeBaseClient documentKnowledgeBaseClient;
    private final BillingEntitlementService billingEntitlementService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ChatSessionResponse createSession(CreateSessionRequest request) {
        ChatSession entity = ChatSession.builder()
                .tenantId(request.getTenantId())
                .userId(request.getUserId())
                .widgetId(request.getWidgetId())
                .channel(request.getChannel() == null ? "WEB" : request.getChannel())
                .title(request.getTitle())
                .status("OPEN")
                .build();
        return mapSession(sessionRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(UUID tenantId) {
        return sessionRepository.findAllByTenantIdOrderByStartedAtDesc(tenantId)
                .stream()
                .map(this::mapSession)
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ChatMessageResponse sendMessage(UUID sessionId, SendMessageRequest request) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        if ("USER".equalsIgnoreCase(request.getSenderType() == null ? "USER" : request.getSenderType())) {
            enforceMessageQuota(session.getTenantId());
        }

        ChatMessage message = ChatMessage.builder()
                .session(session)
                .tenantId(session.getTenantId())
                .senderType(request.getSenderType() == null ? "USER" : request.getSenderType())
                .senderId(request.getSenderId())
                .role(request.getRole() == null ? "USER" : request.getRole())
                .messageType(request.getMessageType() == null ? "TEXT" : request.getMessageType())
                .content(request.getContent())
                .build();

        session.setLastMessageAt(LocalDateTime.now());
        sessionRepository.save(session);

        return mapMessage(messageRepository.save(message));
    }

        @Override
        @Transactional(rollbackFor = Exception.class)
        @SuppressWarnings("unchecked")
        public AskResponse ask(UUID sessionId, AskRequest request) {
        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        enforceMessageQuota(session.getTenantId());

        ChatMessage userMessage = ChatMessage.builder()
            .session(session)
            .tenantId(session.getTenantId())
            .senderType("USER")
            .role("USER")
            .messageType("TEXT")
            .content(request.getQuestion())
            .build();
        userMessage = messageRepository.save(userMessage);

        UUID knowledgeBaseId = resolveKnowledgeBaseId(session, request.getKnowledgeBaseId());

        Map<String, Object> searchPayload = new HashMap<>();
        searchPayload.put("tenant_id", session.getTenantId());
        searchPayload.put("query", request.getQuestion());
        searchPayload.put("top_k", request.getTopK());
        searchPayload.put("knowledge_base_id", knowledgeBaseId);
        Map<String, Object> searchResult = embeddingSearchClient.search(searchPayload);

        Map<String, Object> aiPayload = new HashMap<>();
        aiPayload.put("tenant_id", session.getTenantId());
        aiPayload.put("session_id", sessionId);
        aiPayload.put("message_id", userMessage.getId());
        aiPayload.put("question", request.getQuestion());
        aiPayload.put("top_k", request.getTopK());
        aiPayload.put("temperature", request.getTemperature());
        aiPayload.put("knowledge_base_id", knowledgeBaseId);
        aiPayload.put("page_context", request.getPageContext());
        Map<String, Object> aiResult = aiClient.ask(aiPayload);

        String answer = (String) aiResult.getOrDefault("answer", "");
        ChatMessage assistantMessage = ChatMessage.builder()
            .session(session)
            .tenantId(session.getTenantId())
            .senderType("ASSISTANT")
            .role("ASSISTANT")
            .messageType("TEXT")
            .content(answer)
            .modelName((String) aiResult.getOrDefault("model_name", "gemma4"))
            .build();
        assistantMessage = messageRepository.save(assistantMessage);

        List<ChatMessageCitationResponse> citationResponses = new ArrayList<>();
        Object itemsObj = searchResult != null ? searchResult.get("items") : null;
        if (itemsObj instanceof List<?> rawItems) {
            for (Object raw : rawItems) {
            if (!(raw instanceof Map<?, ?> item)) {
                continue;
            }
            UUID sourceDoc = item.get("source_document_id") == null
                ? null : UUID.fromString(item.get("source_document_id").toString());
            UUID sourceChunk = item.get("source_chunk_id") == null
                ? null : UUID.fromString(item.get("source_chunk_id").toString());
            Double score = item.get("score") == null ? null : Double.valueOf(item.get("score").toString());
            String snippet = item.get("chunk_text") == null ? null : item.get("chunk_text").toString();

            ChatMessageCitation citation = ChatMessageCitation.builder()
                .message(assistantMessage)
                .sourceType("CHUNK")
                .sourceDocumentId(sourceDoc)
                .sourceChunkId(sourceChunk)
                .score(score)
                .snippet(snippet)
                .build();
            citation = citationRepository.save(citation);
            citationResponses.add(mapCitation(citation));
            }
        }

        session.setLastMessageAt(LocalDateTime.now());
        sessionRepository.save(session);

        return AskResponse.builder()
            .sessionId(sessionId)
            .userMessageId(userMessage.getId())
            .assistantMessageId(assistantMessage.getId())
            .answer(answer)
            .citations(citationResponses)
            .build();
        }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @SuppressWarnings("unchecked")
    public AskResponse askStreaming(UUID sessionId, AskRequest request, Consumer<String> tokenConsumer) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        enforceMessageQuota(session.getTenantId());

        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .tenantId(session.getTenantId())
                .senderType("USER")
                .role("USER")
                .messageType("TEXT")
                .content(request.getQuestion())
                .build();
        userMessage = messageRepository.save(userMessage);

        UUID knowledgeBaseId = resolveKnowledgeBaseId(session, request.getKnowledgeBaseId());

        Map<String, Object> aiPayload = new HashMap<>();
        aiPayload.put("tenant_id", session.getTenantId());
        aiPayload.put("session_id", sessionId);
        aiPayload.put("message_id", userMessage.getId());
        aiPayload.put("question", request.getQuestion());
        aiPayload.put("top_k", request.getTopK());
        aiPayload.put("temperature", request.getTemperature());
        aiPayload.put("knowledge_base_id", knowledgeBaseId);
        aiPayload.put("page_context", request.getPageContext());

        StringBuilder streamedAnswer = new StringBuilder();
        Map<String, Object> donePayload = new HashMap<>();

        aiClient.streamAsk(aiPayload, event -> {
            String type = String.valueOf(event.getOrDefault("type", ""));
            if ("TOKEN".equalsIgnoreCase(type)) {
                String token = String.valueOf(event.getOrDefault("token", ""));
                if (!token.isBlank()) {
                    streamedAnswer.append(token);
                    if (tokenConsumer != null) {
                        tokenConsumer.accept(token);
                    }
                }
            } else if ("DONE".equalsIgnoreCase(type)) {
                donePayload.clear();
                donePayload.putAll(event);
            } else if ("ERROR".equalsIgnoreCase(type)) {
                String message = String.valueOf(event.getOrDefault("message", "Unknown stream error"));
                throw new IllegalStateException(message);
            }
        });

        String answer = donePayload.get("answer") == null
                ? streamedAnswer.toString().trim()
                : String.valueOf(donePayload.get("answer")).trim();

        ChatMessage assistantMessage = ChatMessage.builder()
                .session(session)
                .tenantId(session.getTenantId())
                .senderType("ASSISTANT")
                .role("ASSISTANT")
                .messageType("TEXT")
                .content(answer)
                .modelName(String.valueOf(donePayload.getOrDefault("model_name", "gemma4")))
                .build();
        assistantMessage = messageRepository.save(assistantMessage);

        List<ChatMessageCitationResponse> citationResponses = new ArrayList<>();
        Object citationsObj = donePayload.get("citations");
        if (citationsObj instanceof List<?> rawItems) {
            for (Object raw : rawItems) {
                if (!(raw instanceof Map<?, ?> item)) {
                    continue;
                }

                UUID sourceDoc = parseUuid(item.get("source_document_id"));
                UUID sourceChunk = parseUuid(item.get("source_chunk_id"));
                Double score = item.get("score") == null ? null : Double.valueOf(item.get("score").toString());
                String snippet = item.get("snippet") == null ? null : item.get("snippet").toString();

                ChatMessageCitation citation = ChatMessageCitation.builder()
                        .message(assistantMessage)
                        .sourceType("CHUNK")
                        .sourceDocumentId(sourceDoc)
                        .sourceChunkId(sourceChunk)
                        .score(score)
                        .snippet(snippet)
                        .build();
                citation = citationRepository.save(citation);
                citationResponses.add(mapCitation(citation));
            }
        }

        session.setLastMessageAt(LocalDateTime.now());
        sessionRepository.save(session);

        return AskResponse.builder()
                .sessionId(sessionId)
                .userMessageId(userMessage.getId())
                .assistantMessageId(assistantMessage.getId())
                .answer(answer)
                .citations(citationResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> listMessages(UUID sessionId) {
        return messageRepository.findAllBySession_IdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::mapMessage)
                .toList();
    }

        @Override
        @Transactional(readOnly = true)
        public List<ChatMessageCitationResponse> listCitations(UUID messageId) {
        return citationRepository.findAllByMessage_Id(messageId)
            .stream()
            .map(this::mapCitation)
            .toList();
        }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public MessageFeedbackResponse submitFeedback(UUID messageId, MessageFeedbackRequest request) {
        ChatMessage message = messageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        ChatMessageFeedback feedback = feedbackRepository
            .findByMessage_IdAndUserId(messageId, request.getUserId())
            .orElse(ChatMessageFeedback.builder().message(message).userId(request.getUserId()).build());

        feedback.setRating(request.getRating());
        feedback.setReason(request.getReason());
        feedback.setComment(request.getComment());
        return mapFeedback(feedbackRepository.save(feedback));
        }

        @Override
        @Transactional(readOnly = true)
        public List<MessageFeedbackResponse> listFeedback(UUID messageId) {
        return feedbackRepository.findAllByMessage_Id(messageId)
            .stream()
            .map(this::mapFeedback)
            .toList();
        }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void closeSession(UUID sessionId) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        sessionRepository.delete(session);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProviderInfo() {
        return aiClient.getProviderInfo();
    }

    @Override
    @Transactional
    public Map<String, Object> updateProviderMode(String mode) {
        return aiClient.updateProviderMode(mode);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getEmbeddingProviderInfo() {
        return embeddingSearchClient.getProviderInfo();
    }

    @Override
    @Transactional
    public Map<String, Object> updateEmbeddingProviderMode(String mode) {
        return embeddingSearchClient.updateProviderMode(mode);
    }

    private ChatSessionResponse mapSession(ChatSession entity) {
        return ChatSessionResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .userId(entity.getUserId())
                .widgetId(entity.getWidgetId())
                .channel(entity.getChannel())
                .title(entity.getTitle())
                .status(entity.getStatus())
                .startedAt(entity.getStartedAt())
                .lastMessageAt(entity.getLastMessageAt())
                .build();
    }

    private ChatMessageResponse mapMessage(ChatMessage entity) {
        return ChatMessageResponse.builder()
                .id(entity.getId())
                .sessionId(entity.getSession().getId())
                .tenantId(entity.getTenantId())
                .senderType(entity.getSenderType())
                .senderId(entity.getSenderId())
                .role(entity.getRole())
                .messageType(entity.getMessageType())
                .content(entity.getContent())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private ChatMessageCitationResponse mapCitation(ChatMessageCitation entity) {
        return ChatMessageCitationResponse.builder()
                .id(entity.getId())
                .messageId(entity.getMessage().getId())
                .sourceType(entity.getSourceType())
                .sourceDocumentId(entity.getSourceDocumentId())
                .sourceChunkId(entity.getSourceChunkId())
                .sourceUrl(entity.getSourceUrl())
                .score(entity.getScore())
                .snippet(entity.getSnippet())
                .build();
    }

    private MessageFeedbackResponse mapFeedback(ChatMessageFeedback entity) {
        return MessageFeedbackResponse.builder()
                .id(entity.getId())
                .messageId(entity.getMessage().getId())
                .userId(entity.getUserId())
                .rating(entity.getRating())
                .reason(entity.getReason())
                .comment(entity.getComment())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private UUID parseUuid(Object raw) {
        if (raw == null) {
            return null;
        }
        return UUID.fromString(raw.toString());
    }

    private UUID resolveKnowledgeBaseId(ChatSession session, UUID requestedKnowledgeBaseId) {
        if (requestedKnowledgeBaseId != null) {
            return requestedKnowledgeBaseId;
        }

        List<DocumentKnowledgeBaseClient.KnowledgeBaseItem> knowledgeBases = documentKnowledgeBaseClient.listKnowledgeBases()
                .stream()
                .filter(item -> session.getTenantId().equals(item.tenantId()))
                .toList();

        if (knowledgeBases.isEmpty()) {
            throw new IllegalArgumentException("No knowledge base found for tenant " + session.getTenantId());
        }
        if (knowledgeBases.size() > 1) {
            throw new IllegalArgumentException("Multiple knowledge bases found for tenant " + session.getTenantId() + "; knowledgeBaseId is required");
        }

        return knowledgeBases.get(0).id();
    }

    private void enforceMessageQuota(UUID tenantId) {
        var entitlement = billingEntitlementService.getEntitlements(tenantId);
        if (entitlement.isUnlimited() || entitlement.getMonthlyMessageLimit() < 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();
        LocalDateTime startOfNextMonth = startOfMonth.plusMonths(1);
        long usedMessages = messageRepository.countByTenantIdAndSenderTypeBetween(tenantId, "USER", startOfMonth, startOfNextMonth);
        if (usedMessages >= entitlement.getMonthlyMessageLimit()) {
            throw new InvalidDataException("Bạn đã dùng hết " + entitlement.getMonthlyMessageLimit()
                    + " tin nhắn trong tháng của gói hiện tại. Vui lòng nâng cấp gói để tiếp tục.");
        }
    }
}

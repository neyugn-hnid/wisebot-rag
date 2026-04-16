package vandinh.wisebot.chatservice.service;

import vandinh.wisebot.chatservice.dto.request.CreateSessionRequest;
import vandinh.wisebot.chatservice.dto.request.AskRequest;
import vandinh.wisebot.chatservice.dto.request.MessageFeedbackRequest;
import vandinh.wisebot.chatservice.dto.response.AskResponse;
import vandinh.wisebot.chatservice.dto.response.ChatMessageCitationResponse;
import vandinh.wisebot.chatservice.dto.response.MessageFeedbackResponse;
import vandinh.wisebot.chatservice.dto.request.SendMessageRequest;
import vandinh.wisebot.chatservice.dto.response.ChatMessageResponse;
import vandinh.wisebot.chatservice.dto.response.ChatSessionResponse;

import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

public interface ChatService {
    ChatSessionResponse createSession(CreateSessionRequest request);

    List<ChatSessionResponse> listSessions(UUID tenantId);

    ChatMessageResponse sendMessage(UUID sessionId, SendMessageRequest request);

    AskResponse ask(UUID sessionId, AskRequest request);

    AskResponse askStreaming(UUID sessionId, AskRequest request, Consumer<String> tokenConsumer);

    List<ChatMessageResponse> listMessages(UUID sessionId);

    List<ChatMessageCitationResponse> listCitations(UUID messageId);

    MessageFeedbackResponse submitFeedback(UUID messageId, MessageFeedbackRequest request);

    List<MessageFeedbackResponse> listFeedback(UUID messageId);

    void closeSession(UUID sessionId);
}

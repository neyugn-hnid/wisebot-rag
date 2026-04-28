package vandinh.wisebot.chatservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import vandinh.wisebot.chatservice.dto.request.AskRequest;
import vandinh.wisebot.chatservice.dto.request.RealtimeAskRequest;
import vandinh.wisebot.chatservice.dto.response.AskResponse;
import vandinh.wisebot.chatservice.dto.response.RealtimeEventResponse;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RealtimeChatService {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @Async
    public void askAndStream(UUID sessionId, RealtimeAskRequest request) {
        String destination = "/topic/sessions/" + sessionId;

        publish(destination, sessionId, "ACK", "Question received");

        try {
            AskRequest askRequest = new AskRequest();
            askRequest.setQuestion(request.getQuestion());
            askRequest.setTopK(request.getTopK());
            askRequest.setTemperature(request.getTemperature());
            askRequest.setKnowledgeBaseId(request.getKnowledgeBaseId());

            AskResponse response = chatService.askStreaming(
                    sessionId,
                    askRequest,
                    token -> publish(destination, sessionId, "TOKEN", token)
            );

            publish(destination, sessionId, "DONE", response);
        } catch (Exception ex) {
            publish(destination, sessionId, "ERROR", ex.getMessage());
        }
    }

    private void publish(String destination, UUID sessionId, String type, Object data) {
        messagingTemplate.convertAndSend(
                destination,
                RealtimeEventResponse.builder()
                        .type(type)
                        .sessionId(sessionId)
                        .data(data)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }
}

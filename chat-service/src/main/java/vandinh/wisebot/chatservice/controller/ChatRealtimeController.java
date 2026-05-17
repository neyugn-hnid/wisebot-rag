package vandinh.wisebot.chatservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import vandinh.wisebot.chatservice.dto.request.RealtimeAskRequest;
import vandinh.wisebot.chatservice.service.RealtimeChatService;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatRealtimeController {

    private final RealtimeChatService realtimeChatService;

    @MessageMapping("/sessions/{sessionId}/ask")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER','AGENT')")
    public void askRealtime(@DestinationVariable UUID sessionId, RealtimeAskRequest request) {
        realtimeChatService.askAndStream(sessionId, request);
    }
}

package vandinh.wisebot.chatservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.chatservice.entity.ChatMessage;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findAllBySession_IdOrderByCreatedAtAsc(UUID sessionId);
}

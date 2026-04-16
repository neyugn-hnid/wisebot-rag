package vandinh.wisebot.chatservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.chatservice.entity.ChatMessageFeedback;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatMessageFeedbackRepository extends JpaRepository<ChatMessageFeedback, UUID> {
    Optional<ChatMessageFeedback> findByMessage_IdAndUserId(UUID messageId, UUID userId);

    List<ChatMessageFeedback> findAllByMessage_Id(UUID messageId);
}

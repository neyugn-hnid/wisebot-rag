package vandinh.wisebot.chatservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import vandinh.wisebot.chatservice.entity.ChatMessageFeedback;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatMessageFeedbackRepository extends JpaRepository<ChatMessageFeedback, UUID> {
    Optional<ChatMessageFeedback> findByMessage_IdAndUserId(UUID messageId, UUID userId);

    List<ChatMessageFeedback> findAllByMessage_Id(UUID messageId);

    @Modifying
    @Query("delete from ChatMessageFeedback f where f.message.session.id in :sessionIds")
    int deleteBySessionIds(List<UUID> sessionIds);
}

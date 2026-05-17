package vandinh.wisebot.chatservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.chatservice.entity.ChatMessageCitation;

import java.util.List;
import java.util.UUID;

public interface ChatMessageCitationRepository extends JpaRepository<ChatMessageCitation, UUID> {
    List<ChatMessageCitation> findAllByMessage_Id(UUID messageId);
}

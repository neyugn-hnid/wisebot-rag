package vandinh.wisebot.chatservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import vandinh.wisebot.chatservice.entity.ChatMessageCitation;

import java.util.List;
import java.util.UUID;

public interface ChatMessageCitationRepository extends JpaRepository<ChatMessageCitation, UUID> {
    List<ChatMessageCitation> findAllByMessage_Id(UUID messageId);

    @Modifying
    @Query("delete from ChatMessageCitation c where c.message.session.id in :sessionIds")
    int deleteBySessionIds(List<UUID> sessionIds);
}

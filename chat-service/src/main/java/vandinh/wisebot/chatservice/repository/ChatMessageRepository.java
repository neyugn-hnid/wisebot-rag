package vandinh.wisebot.chatservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import vandinh.wisebot.chatservice.entity.ChatMessage;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findAllBySession_IdOrderByCreatedAtAsc(UUID sessionId);

    @Query("""
            select count(m) from ChatMessage m
            where m.tenantId = :tenantId
              and m.senderType = :senderType
              and m.createdAt >= :start
              and m.createdAt < :end
            """)
    long countByTenantIdAndSenderTypeBetween(UUID tenantId, String senderType, LocalDateTime start, LocalDateTime end);

    @Modifying
    @Query("delete from ChatMessage m where m.session.id in :sessionIds")
    int deleteBySessionIds(List<UUID> sessionIds);
}

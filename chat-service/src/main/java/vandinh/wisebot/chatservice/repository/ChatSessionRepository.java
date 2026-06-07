package vandinh.wisebot.chatservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import vandinh.wisebot.chatservice.entity.ChatSession;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    List<ChatSession> findAllByTenantIdOrderByStartedAtDesc(UUID tenantId);

    @Query("""
            select s.id from ChatSession s
            where s.channel = 'WIDGET'
              and coalesce(s.lastMessageAt, s.startedAt) < :cutoff
            order by coalesce(s.lastMessageAt, s.startedAt) asc
            """)
    List<UUID> findExpiredWidgetSessionIds(LocalDateTime cutoff, Pageable pageable);

    @Modifying
    @Query("delete from ChatSession s where s.id in :sessionIds")
    int deleteByIdIn(List<UUID> sessionIds);
}

package vandinh.wisebot.chatservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vandinh.wisebot.chatservice.entity.ChatSession;

import java.util.List;
import java.util.UUID;

public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    List<ChatSession> findAllByTenantIdOrderByStartedAtDesc(UUID tenantId);
}

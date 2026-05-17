package vandinh.wisebot.documentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vandinh.wisebot.documentservice.entity.KnowledgeBase;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, UUID> {
    List<KnowledgeBase> findAllByTenantId(UUID tenantId);
    Optional<KnowledgeBase> findByIdAndTenantId(UUID id, UUID tenantId);
    long countByTenantId(UUID tenantId);
}

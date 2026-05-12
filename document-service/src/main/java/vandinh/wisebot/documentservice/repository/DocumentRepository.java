package vandinh.wisebot.documentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vandinh.wisebot.documentservice.entity.Document;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
	List<Document> findAllByKnowledgeBase_Id(UUID knowledgeBaseId);

	long countByKnowledgeBase_TenantId(UUID tenantId);

	@Query("select coalesce(sum(d.size), 0) from Document d where d.knowledgeBase.tenantId = :tenantId")
	long sumFileSizeByTenantId(@Param("tenantId") UUID tenantId);
}

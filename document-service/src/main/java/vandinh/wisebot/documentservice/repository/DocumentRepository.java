package vandinh.wisebot.documentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vandinh.wisebot.documentservice.entity.Document;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
	List<Document> findAllByKnowledgeBase_Id(UUID knowledgeBaseId);
}

package vandinh.wisebot.documentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vandinh.wisebot.documentservice.entity.DocumentChunk;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {
    List<DocumentChunk> findAllByDocument_Id(UUID documentId);
    void deleteAllByDocument_Id(UUID documentId);

    @Query("SELECT c FROM DocumentChunk c " +
            "WHERE c.document.knowledgeBase.id = :knowledgeBaseId " +
            "AND lower(c.content) LIKE lower(concat('%', :query, '%'))")
    List<DocumentChunk> searchInKnowledgeBase(UUID knowledgeBaseId, String query);
}

package vandinh.wisebot.chatservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vandinh.wisebot.chatservice.config.ChatRetentionProperties;
import vandinh.wisebot.chatservice.repository.ChatMessageCitationRepository;
import vandinh.wisebot.chatservice.repository.ChatMessageFeedbackRepository;
import vandinh.wisebot.chatservice.repository.ChatMessageRepository;
import vandinh.wisebot.chatservice.repository.ChatSessionRepository;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRetentionCleanupService {

    private final ChatRetentionProperties retentionProperties;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatMessageCitationRepository citationRepository;
    private final ChatMessageFeedbackRepository feedbackRepository;

    @Scheduled(
            initialDelayString = "${chat.retention.cleanup-initial-delay-ms:300000}",
            fixedDelayString = "${chat.retention.cleanup-fixed-delay-ms:86400000}"
    )
    @Transactional
    public void cleanupExpiredWidgetSessions() {
        if (!retentionProperties.isCleanupEnabled()) {
            return;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionProperties.getWidgetSessionDays());
        var expiredSessionIds = sessionRepository.findExpiredWidgetSessionIds(
                cutoff,
                PageRequest.of(0, Math.max(1, retentionProperties.getBatchSize()))
        );
        if (expiredSessionIds.isEmpty()) {
            return;
        }

        int deletedCitations = citationRepository.deleteBySessionIds(expiredSessionIds);
        int deletedFeedback = feedbackRepository.deleteBySessionIds(expiredSessionIds);
        int deletedMessages = messageRepository.deleteBySessionIds(expiredSessionIds);
        int deletedSessions = sessionRepository.deleteByIdIn(expiredSessionIds);

        log.info(
                "Cleaned expired widget chat data: sessions={}, messages={}, citations={}, feedback={}, cutoff={}",
                deletedSessions,
                deletedMessages,
                deletedCitations,
                deletedFeedback,
                cutoff
        );
    }
}

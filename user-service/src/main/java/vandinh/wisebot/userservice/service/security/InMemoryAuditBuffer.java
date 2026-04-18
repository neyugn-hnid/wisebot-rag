package vandinh.wisebot.userservice.service.security;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class InMemoryAuditBuffer {

    private final ConcurrentLinkedDeque<AuditLogEntry> queue = new ConcurrentLinkedDeque<>();

    public void enqueue(AuditLogEntry entry, int maxLength) {
        if (maxLength <= 0 || entry == null) {
            return;
        }

        queue.addFirst(entry);
        while (queue.size() > maxLength) {
            queue.pollLast();
        }
    }

    public List<AuditLogEntry> pollBatch(int batchSize) {
        if (batchSize <= 0) {
            return List.of();
        }

        List<AuditLogEntry> entries = new ArrayList<>(batchSize);
        for (int i = 0; i < batchSize; i++) {
            AuditLogEntry entry = queue.pollLast();
            if (entry == null) {
                break;
            }
            entries.add(entry);
        }
        return entries;
    }
}
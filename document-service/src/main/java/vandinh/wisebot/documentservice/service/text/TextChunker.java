package vandinh.wisebot.documentservice.service.text;

import org.springframework.stereotype.Service;
import vandinh.wisebot.documentservice.config.ChunkingProperties;

import java.util.ArrayList;
import java.util.List;

@Service
public class TextChunker {

    private final ChunkingProperties properties;

    public TextChunker(ChunkingProperties properties) {
        this.properties = properties;
    }

    public List<String> chunk(String text) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return chunks;
        }

        int chunkSize = Math.max(properties.getChunkSize(), 1);
        int overlap = Math.max(properties.getOverlap(), 0);
        if (overlap >= chunkSize) {
            overlap = 0;
        }

        int start = 0;
        int length = text.length();
        while (start < length) {
            int end = Math.min(start + chunkSize, length);
            String part = text.substring(start, end).trim();
            if (!part.isBlank()) {
                chunks.add(part);
            }
            if (end == length) {
                break;
            }
            start = end - overlap;
        }
        return chunks;
    }
}

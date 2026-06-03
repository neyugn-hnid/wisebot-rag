package vandinh.wisebot.documentservice.service.text;

import org.springframework.stereotype.Service;
import vandinh.wisebot.documentservice.config.ChunkingProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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

    // ========================================================
    // Section-aware chunking for MinerU Markdown output
    // ========================================================

    private static final Pattern HEADING_PATTERN =
            Pattern.compile("^(#{1,4})\\s+(.+)$", Pattern.MULTILINE);
    private static final Pattern SENTENCE_PATTERN =
            Pattern.compile("(?<=[.!?])\\s+");

    /**
     * Chunk Markdown text by section headings.
     * Mỗi heading (## / ### / ####) là một section boundary.
     * Giữ nguyên bảng, code block trong section.
     */
    public List<String> chunkMarkdown(String markdown) {
        int chunkSize = Math.max(properties.getChunkSize(), 1);
        return chunkBySections(markdown, chunkSize);
    }

    public List<String> chunkBySections(String markdown, int maxChunkSize) {
        if (markdown == null || markdown.isBlank()) {
            return List.of();
        }
        int minSize = Math.max(maxChunkSize / 3, 100);

        // Split by headings (## / ### as section boundaries)
        List<String> sections = splitByHeadings(markdown);
        if (sections.isEmpty()) {
            return chunk(markdown);
        }

        List<String> result = new ArrayList<>();
        StringBuilder buffer = new StringBuilder();

        for (String section : sections) {
            if (buffer.isEmpty()) {
                buffer.append(section);
            } else if (buffer.length() + section.length() + 1 <= maxChunkSize) {
                buffer.append("\n\n").append(section);
            } else {
                if (buffer.length() >= minSize) {
                    result.add(buffer.toString().trim());
                } else if (!result.isEmpty()) {
                    String merged = result.remove(result.size() - 1) + "\n\n" + buffer;
                    result.add(merged);
                } else {
                    result.add(buffer.toString().trim());
                }
                buffer = new StringBuilder(section);
            }
        }

        if (!buffer.isEmpty()) {
            result.add(buffer.toString().trim());
        }

        // Split oversized sections
        List<String> refined = new ArrayList<>();
        for (String chunk : result) {
            if (chunk.length() > maxChunkSize * 1.5) {
                refined.addAll(splitLongSection(chunk, maxChunkSize, minSize));
            } else {
                refined.add(chunk);
            }
        }
        return refined;
    }

    private List<String> splitByHeadings(String markdown) {
        List<String> sections = new ArrayList<>();
        Matcher matcher = HEADING_PATTERN.matcher(markdown);
        int lastEnd = 0;
        String lastHeading = "";

        while (matcher.find()) {
            if (lastEnd > 0) {
                String section = (lastHeading + "\n" + markdown.substring(lastEnd, matcher.start())).trim();
                if (!section.isEmpty()) {
                    sections.add(section);
                }
            }
            lastHeading = matcher.group();
            lastEnd = matcher.end();
        }

        if (lastEnd < markdown.length()) {
            String section = (lastHeading.isEmpty() ? "" : lastHeading + "\n")
                    + markdown.substring(lastEnd).trim();
            if (!section.isBlank()) {
                sections.add(section.trim());
            }
        } else if (!lastHeading.isEmpty()) {
            sections.add(lastHeading);
        }

        if (sections.isEmpty()) {
            String trimmed = markdown.trim();
            if (!trimmed.isEmpty()) {
                sections.add(trimmed);
            }
        }
        return sections;
    }

    private List<String> splitLongSection(String text, int maxSize, int minSize) {
        String[] sentences = SENTENCE_PATTERN.split(text);
        List<String> result = new ArrayList<>();
        StringBuilder buffer = new StringBuilder();

        for (String sentence : sentences) {
            if (buffer.isEmpty()) {
                buffer.append(sentence.trim());
            } else if (buffer.length() + sentence.length() + 1 <= maxSize) {
                buffer.append(" ").append(sentence.trim());
            } else {
                if (buffer.length() >= minSize) {
                    result.add(buffer.toString());
                } else if (!result.isEmpty()) {
                    result.set(result.size() - 1, result.get(result.size() - 1) + " " + buffer);
                }
                buffer = new StringBuilder(sentence.trim());
            }
        }
        if (!buffer.isEmpty()) {
            result.add(buffer.toString());
        }
        return result;
    }
}

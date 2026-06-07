package vandinh.wisebot.documentservice.service.text;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.config.MineruProperties;
import vandinh.wisebot.documentservice.service.mineru.MineruClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * TextExtractor dùng MinerU cho chất lượng parse cao nhất.
 * - PDF: layout chính xác, bảng biểu, công thức
 * - DOCX, PPTX, XLSX: native parsing
 *
 * Fallback về Tika nếu MinerU disabled hoặc thất bại.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "mineru.enabled", havingValue = "true", matchIfMissing = false)
public class MineruTextExtractor implements TextExtractor {

    private final MineruClient mineruClient;
    private final MineruProperties mineruProperties;
    private final TikaTextExtractor tikaFallback;

    @Override
    public String extract(MultipartFile file) {
        if (!mineruProperties.isEnabled()) {
            return tikaFallback.extract(file);
        }

        String filename = file.getOriginalFilename();
        if (isPlainTextFile(filename)) {
            return tikaFallback.extract(file);
        }

        try {
            MineruClient.MineruResult result = mineruClient.parse(file.getBytes(), filename);
            if (result != null && result.hasContent()) {
                log.info("MinerU parsed: {} ({} chars)", filename, result.getMarkdown().length());
                return result.getMarkdown();
            }
            log.warn("MinerU empty for {}, fallback Tika", filename);
        } catch (Exception e) {
            log.error("MinerU failed for {}, fallback Tika", filename, e);
        }

        return tikaFallback.extract(file);
    }

    @Override
    public String extract(InputStream inputStream) {
        if (!mineruProperties.isEnabled()) {
            return tikaFallback.extract(inputStream);
        }

        // InputStream không có filename → không thể gọi MinerU
        // Fallback về Tika
        return tikaFallback.extract(inputStream);
    }

    @Override
    public String extract(byte[] content, String filename) {
        if (!mineruProperties.isEnabled() || isPlainTextFile(filename)) {
            return tikaFallback.extract(content, filename);
        }

        try {
            MineruClient.MineruResult result = mineruClient.parse(content, filename);
            if (result != null && result.hasContent()) {
                log.info("MinerU parsed: {} ({} chars)", filename, result.getMarkdown().length());
                return result.getMarkdown();
            }
            log.warn("MinerU empty for {}, fallback Tika", filename);
        } catch (Exception e) {
            log.error("MinerU failed for {}, fallback Tika", filename, e);
        }

        return tikaFallback.extract(content, filename);
    }

    private boolean isPlainTextFile(String filename) {
        if (filename == null) return true;
        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase() : "";
        return ext.equals("txt") || ext.equals("csv") || ext.equals("json") || ext.equals("xml");
    }
}

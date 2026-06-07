package vandinh.wisebot.documentservice.service.text;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.config.MarkitdownProperties;
import vandinh.wisebot.documentservice.config.MineruProperties;
import vandinh.wisebot.documentservice.service.markitdown.MarkitdownClient;
import vandinh.wisebot.documentservice.service.mineru.MineruClient;

import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Primary
@Service
@RequiredArgsConstructor
public class SmartTextExtractor implements TextExtractor {

    private final ObjectProvider<MineruClient> mineruClientProvider;
    private final ObjectProvider<MarkitdownClient> markitdownClientProvider;
    private final MineruProperties mineruProperties;
    private final MarkitdownProperties markitdownProperties;
    private final TikaTextExtractor tikaFallback;

    @Override
    public String extract(MultipartFile file) {
        try {
            return extract(file.getBytes(), file.getOriginalFilename());
        } catch (IOException e) {
            return tikaFallback.extract(file);
        }
    }

    @Override
    public String extract(InputStream inputStream) {
        return tikaFallback.extract(inputStream);
    }

    @Override
    public String extract(byte[] content, String filename) {
        if (content == null || content.length == 0) {
            return "";
        }

        if (shouldUseMineru(filename)) {
            MineruClient mineruClient = mineruClientProvider.getIfAvailable();
            if (mineruClient != null) {
                MineruClient.MineruResult result = mineruClient.parse(content, filename);
                if (result != null && result.hasContent()) {
                    log.info("MinerU parsed: {} ({} chars)", filename, result.getMarkdown().length());
                    return result.getMarkdown();
                }
                log.warn("MinerU empty or failed for {}, trying MarkItDown", filename);
            }
        }

        if (shouldUseMarkitdown(filename)) {
            MarkitdownClient markitdownClient = markitdownClientProvider.getIfAvailable();
            if (markitdownClient != null) {
                MarkitdownClient.MarkitdownResult result = markitdownClient.parse(content, filename);
                if (result != null && result.hasContent()) {
                    log.info("MarkItDown parsed: {} ({} chars)", filename, result.getMarkdown().length());
                    return result.getMarkdown();
                }
                log.warn("MarkItDown empty or failed for {}, fallback Tika", filename);
            }
        }

        return tikaFallback.extract(content, filename);
    }

    private boolean shouldUseMineru(String filename) {
        if (!mineruProperties.isEnabled()) {
            return false;
        }
        String ext = extension(filename);
        return ext.equals("pdf")
                || ext.equals("png")
                || ext.equals("jpg")
                || ext.equals("jpeg")
                || ext.equals("webp")
                || ext.equals("bmp")
                || ext.equals("tiff");
    }

    private boolean shouldUseMarkitdown(String filename) {
        if (!markitdownProperties.isEnabled()) {
            return false;
        }
        return !extension(filename).equals("txt");
    }

    private String extension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}

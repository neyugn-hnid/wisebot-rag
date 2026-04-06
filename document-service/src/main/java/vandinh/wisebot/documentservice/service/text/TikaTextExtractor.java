package vandinh.wisebot.documentservice.service.text;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.exception.InvalidDataException;

import java.io.IOException;

@Service
public class TikaTextExtractor implements TextExtractor {

    private final Tika tika = new Tika();

    @Override
    public String extract(MultipartFile file) {
        try {
            return tika.parseToString(file.getInputStream());
        } catch (IOException | TikaException e) {
            throw new InvalidDataException("Failed to extract text: " + e.getMessage());
        }
    }
}

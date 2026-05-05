package vandinh.wisebot.documentservice.service.text;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.exception.InvalidDataException;

import java.io.IOException;
import java.io.InputStream;

@Service
public class TikaTextExtractor implements TextExtractor {

    private final Tika tika = new Tika();

    @Override
    public String extract(MultipartFile file) {
        try {
            return extract(file.getInputStream());
        } catch (IOException e) {
            throw new InvalidDataException("Lỗi khi trích xuất văn bản: " + e.getMessage());
        }
    }

    @Override
    public String extract(InputStream inputStream) {
        try {
            return tika.parseToString(inputStream);
        } catch (IOException | TikaException e) {
            throw new InvalidDataException("Lỗi khi trích xuất văn bản: " + e.getMessage());
        }
    }
}

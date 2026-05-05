package vandinh.wisebot.documentservice.service.storage;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import vandinh.wisebot.documentservice.config.StorageProperties;
import vandinh.wisebot.documentservice.exception.InvalidDataException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileSystemStorageService implements StorageService {

    private final StorageProperties properties;

    public FileSystemStorageService(StorageProperties properties) {
        this.properties = properties;
    }

    @Override
    public String store(UUID knowledgeBaseId, MultipartFile file) {
        if (!properties.isEnabled()) {
            return null;
        }

        String originalName = file.getOriginalFilename();
        String filename = StringUtils.hasText(originalName) ? originalName : "file";
        String storedName = knowledgeBaseId + "_" + UUID.randomUUID() + "_" + filename;

        try {
            Path base = Paths.get(properties.getBasePath()).toAbsolutePath().normalize();
            Files.createDirectories(base);
            Path target = base.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return target.toString();
        } catch (IOException e) {
            throw new InvalidDataException("Lỗi khi lưu tệp: " + e.getMessage());
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new InvalidDataException("Lỗi khi tải tệp: " + storagePath);
        }
        try {
            Path path = Paths.get(storagePath).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) {
                throw new InvalidDataException("Tệp không tồn tại: " + storagePath);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new InvalidDataException("Đường dẫn lưu trữ không hợp lệ: " + storagePath);
        }
    }
}

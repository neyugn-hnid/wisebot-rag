package vandinh.wisebot.userservice.service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.config.AppFeatureProperties;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class InMemoryJwtBlacklistService implements JwtBlacklistService {

    private final AppFeatureProperties properties;
    private final Map<String, Instant> blacklist = new ConcurrentHashMap<>();

    @Override
    public void blacklist(String token, Date expiry) {
        if (!properties.getJwtBlacklist().isEnabled() || expiry == null) {
            return;
        }

        Instant expiresAt = expiry.toInstant();
        if (expiresAt.isBefore(Instant.now())) {
            return;
        }

        blacklist.put(buildKey(token), expiresAt);
    }

    @Override
    public boolean isBlacklisted(String token) {
        if (!properties.getJwtBlacklist().isEnabled()) {
            return false;
        }

        String key = buildKey(token);
        Instant expiresAt = blacklist.get(key);
        if (expiresAt == null) {
            return false;
        }

        if (expiresAt.isBefore(Instant.now())) {
            blacklist.remove(key);
            return false;
        }

        return true;
    }

    private String buildKey(String token) {
        return properties.getJwtBlacklist().getPrefix() + hashToken(token);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            return token;
        }
    }
}
package vandinh.wisebot.userservice.service.redis;

import java.util.Date;

public interface JwtBlacklistService {
    void blacklist(String token, Date expiry);
    boolean isBlacklisted(String token);
}

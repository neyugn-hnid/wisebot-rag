package vandinh.wisebot.userservice.service.security;

import java.util.Date;

public interface JwtBlacklistService {
    void blacklist(String token, Date expiry);
    boolean isBlacklisted(String token);
}
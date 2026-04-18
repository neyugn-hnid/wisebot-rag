package vandinh.wisebot.userservice.service.security;

public interface RateLimiterService {
    boolean isAllowed(String clientKey);
}
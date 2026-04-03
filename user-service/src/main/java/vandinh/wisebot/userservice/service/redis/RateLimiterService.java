package vandinh.wisebot.userservice.service.redis;

public interface RateLimiterService {
    boolean isAllowed(String clientKey);
}

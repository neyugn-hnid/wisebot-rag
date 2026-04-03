package vandinh.wisebot.userservice.service;

import org.springframework.security.core.userdetails.UserDetails;
import vandinh.wisebot.userservice.common.enums.TokenType;

import java.util.Date;
import java.util.List;
import java.util.UUID;

public interface JwtService {
    String generateAccessToken(UUID userId, String email, List<String> authorities);
    String generateRefreshToken(UUID userId, String email, List<String> authorities);
    String extractEmail(String token, TokenType type);
    UUID extractUserId(String token, TokenType type);
    boolean isTokenValid(String token, UserDetails userDetails);
    boolean isTokenExpired(String token, TokenType type);
    Date extractExpiration(String token, TokenType type);
}
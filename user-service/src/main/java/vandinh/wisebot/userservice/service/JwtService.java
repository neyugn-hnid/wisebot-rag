package vandinh.wisebot.userservice.service;

import org.springframework.security.core.userdetails.UserDetails;
import vandinh.wisebot.userservice.common.enums.TokenType;

import java.util.Date;
import java.util.List;

public interface JwtService {
    String generateAccessToken(String email, List<String> authorities);
    String generateRefreshToken(String email, List<String> authorities);
    String extractEmail(String token, TokenType type);
    boolean isTokenValid(String token, UserDetails userDetails);
    boolean isTokenExpired(String token, TokenType type);
    Date extractExpiration(String token, TokenType type);
}
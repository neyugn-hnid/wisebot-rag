package vandinh.wisebot.userservice.service.impl;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.common.enums.TokenType;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.exception.InvalidDataException;
import vandinh.wisebot.userservice.service.JwtService;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static vandinh.wisebot.userservice.common.enums.TokenType.ACCESS_TOKEN;
import static vandinh.wisebot.userservice.common.enums.TokenType.REFRESH_TOKEN;

@Service
@Slf4j(topic = "JWT-SERVICE")
public class JwtServiceImpl implements JwtService {
    @Value("${jwt.expiryMinutes:60}")
    private long expiryMinutes;

    @Value("${jwt.expiryDay:14}")
    private long expiryDay;

    @Value("${jwt.accessKey:dummy-access-key}")
    private String accessKey;

    @Value("${jwt.refreshKey:dummy-refresh-key}")
    private String refreshKey;

    @Override
    public String generateAccessToken(Long userId, String email, List<String> authorities) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", authorities);
        claims.put("userId", userId);
        claims.put("email", email);
        return createAccessToken(claims, userId);
    }

    @Override
    public String generateRefreshToken(Long userId, String email, List<String> authorities) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", authorities);
        claims.put("userId", userId);
        claims.put("email", email);
        return createRefreshToken(claims, userId);
    }

    @Override
    public String extractEmail(String token, TokenType type) {
        String email = extractClaim(token, type, claims -> claims.get("email", String.class));
        if (email != null && !email.isBlank()) {
            return email;
        }

        String subject = extractClaim(token, type, Claims::getSubject);
        return (subject != null && subject.contains("@")) ? subject : null;
    }

    @Override
    public Long extractUserId(String token, TokenType type) {
        return extractClaim(token, type, claims -> claims.get("userId", Long.class));
    }

    @Override
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            if (!(userDetails instanceof UserEntity userEntity)) {
                return false;
            }

            Long tokenUserId = extractUserId(token, ACCESS_TOKEN);
            return tokenUserId != null
                    && tokenUserId.equals(userEntity.getId())
                    && !isTokenExpired(token, ACCESS_TOKEN);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token, TokenType type) {
        return extractExpiration(token, type).before(new Date());
    }

    public Date extractExpiration(String token, TokenType type) {
        return extractClaim(token, type, Claims::getExpiration);
    }


    private String createAccessToken(Map<String, Object> claims, Long userId) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(String.valueOf(userId))
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * expiryMinutes))
                .signWith(getKey(ACCESS_TOKEN), SignatureAlgorithm.HS256)
                .compact();
    }

    private String createRefreshToken(Map<String, Object> claims, Long userId) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(String.valueOf(userId))
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24 * expiryDay))
                .signWith(getKey(REFRESH_TOKEN), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getKey(TokenType type) {
        switch (type) {
            case ACCESS_TOKEN -> {
                return Keys.hmacShaKeyFor(Decoders.BASE64.decode(accessKey));
            }
            case REFRESH_TOKEN -> {
                return Keys.hmacShaKeyFor(Decoders.BASE64.decode(refreshKey));
            }
            default -> throw new InvalidDataException("Invalid token type");
        }
    }

    private <T> T extractClaim(String token, TokenType type, Function<Claims, T> claimResolver) {
        final Claims claims = extraAllClaim(token, type);
        return claimResolver.apply(claims);
    }

    private Claims extraAllClaim(String token, TokenType type) {
        try {
            return Jwts.parserBuilder().setSigningKey(getKey(type)).build().parseClaimsJws(token).getBody();
        } catch (SignatureException | ExpiredJwtException e) {
            throw new AccessDeniedException("Access denied: " + e.getMessage());
        }
    }


}


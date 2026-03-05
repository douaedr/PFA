package com.hospital.patient.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret:medsys-secret-key-hospital-management-2026-very-long-secret}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}") // 24h par défaut
    private long jwtExpiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Long patientId, String cin) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("patientId", patientId);
        claims.put("cin", cin);
        claims.put("role", "PATIENT");

        return Jwts.builder()
                .claims(claims)
                .subject(cin)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractCin(String token) {
        return extractClaims(token).getSubject();
    }

    public Long extractPatientId(String token) {
        return extractClaims(token).get("patientId", Long.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}

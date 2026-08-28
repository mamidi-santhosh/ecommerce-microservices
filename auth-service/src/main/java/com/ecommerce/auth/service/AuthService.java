package com.ecommerce.auth.service;

import com.ecommerce.auth.dto.AuthResponse;
import com.ecommerce.auth.dto.LoginRequest;
import com.ecommerce.auth.dto.RefreshRequest;
import com.ecommerce.auth.dto.RegisterRequest;
import com.ecommerce.auth.model.RefreshToken;
import com.ecommerce.auth.model.User;
import com.ecommerce.auth.repository.RefreshTokenRepository;
import com.ecommerce.auth.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    @Value("${jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
    }

    @PostConstruct
    public void initDefaultUser() {
        if (!userRepository.existsByEmail("user@example.com")) {
            User demoUser = new User(null, "user@example.com", "password123", "Demo User", "ROLE_USER");
            userRepository.save(demoUser);
            System.out.println(">>> [AUTH SERVICE] Default Demo User initialized: user@example.com / password123");
        }
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse(null, null, request.getEmail(), null, null, "Email is already registered!");
        }

        User user = new User(null, request.getEmail(), request.getPassword(), request.getName(), "ROLE_USER");
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getRole());
        RefreshToken refreshToken = createRefreshToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                "User registered successfully!"
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(request.getPassword())) {
            return new AuthResponse(null, null, request.getEmail(), null, null, "Invalid email or password!");
        }

        User user = userOpt.get();
        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getRole());
        RefreshToken refreshToken = createRefreshToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                "Login successful!"
        );
    }

    @Transactional
    public AuthResponse refreshAccessToken(RefreshRequest request) {
        String tokenStr = request.getRefreshToken();
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(tokenStr);

        if (tokenOpt.isEmpty()) {
            return new AuthResponse(null, null, null, null, null, "Invalid Refresh Token!");
        }

        RefreshToken refreshToken = tokenOpt.get();

        if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            return new AuthResponse(null, null, null, null, null, "Refresh Token has expired or been revoked! Please log in again.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user.getEmail(), user.getRole());

        return new AuthResponse(
                newAccessToken,
                refreshToken.getToken(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                "Access Token refreshed successfully!"
        );
    }

    @Transactional
    public boolean logout(String refreshTokenStr) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshTokenStr);
        if (tokenOpt.isPresent()) {
            RefreshToken refreshToken = tokenOpt.get();
            refreshToken.setRevoked(true);
            refreshTokenRepository.delete(refreshToken);
            System.out.println(">>> [AUTH SERVICE] Refresh Token revoked and deleted for user: " + refreshToken.getUser().getEmail());
            return true;
        }
        return false;
    }

    private RefreshToken createRefreshToken(User user) {
        // Delete existing refresh token if present
        refreshTokenRepository.findByUser(user).ifPresent(refreshTokenRepository::delete);

        RefreshToken refreshToken = new RefreshToken(
                null,
                UUID.randomUUID().toString(),
                user,
                Instant.now().plusMillis(refreshTokenExpirationMs),
                false
        );
        return refreshTokenRepository.save(refreshToken);
    }
}

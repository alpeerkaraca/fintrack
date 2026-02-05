package com.alpeerkaraca.fintrackserver.Model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_user", columnList = "userId"),
                @Index(name = "idx_refresh_jti", columnList = "jti")},
        uniqueConstraints = {
                @UniqueConstraint(name = "uc_refresh_token_hash", columnNames = {"tokenHash"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tokenHash;
    private String jti;
    @Column(nullable = false)
    private UUID userId;

    private Date issuedAt;
    @Column(nullable = false)
    private Date expiresAt;
    @Builder.Default
    private boolean revoked = false;
    private Long replacedBy;

    private String ipAddress;
    private String userAgent;

    @Builder.Default
    private Instant createdAt = Instant.now();
}

package vandinh.wisebot.widgetservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "widget_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WidgetSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "widget_id", nullable = false)
    private Widget widget;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "visitor_id", length = 120)
    private String visitorId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "source_url", columnDefinition = "text")
    private String sourceUrl;

    @Column(name = "referrer_url", columnDefinition = "text")
    private String referrerUrl;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "text")
    private String userAgent;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;
}

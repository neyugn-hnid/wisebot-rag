package vandinh.wisebot.userservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_logs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailLog implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String recipient;

    @Column(name = "template_id", length = 100)
    private String templateId;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, SEND, FAILED

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

package vandinh.wisebot.userservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_logs")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmailLog implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "recipient", nullable = false)
    private String recipient;

    @Column(name = "template_id", nullable = false)
    private String templateId;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;


}
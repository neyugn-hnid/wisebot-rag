package vandinh.wisebot.billingservice.entity;

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
@Table(name = "billing_payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "invoice_id", nullable = false)
    private BillingInvoice invoice;

    @Column(nullable = false, length = 30)
    private String provider;

    @Column(name = "provider_payment_id", length = 120)
    private String providerPaymentId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "raw_payload", columnDefinition = "jsonb")
    private String rawPayload;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

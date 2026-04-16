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
@Table(name = "billing_plan_prices")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingPlanPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "plan_id", nullable = false)
    private BillingPlan plan;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    private String billingCycle;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(name = "trial_days", nullable = false)
    private int trialDays;

    @CreationTimestamp
    @Column(name = "effective_from", updatable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "effective_to")
    private LocalDateTime effectiveTo;
}

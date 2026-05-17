package vandinh.wisebot.billingservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "billing_usage_meters")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingUsageMeter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "meter_code", nullable = false, unique = true, length = 60)
    private String meterCode;

    @Column(name = "meter_name", nullable = false, length = 120)
    private String meterName;

    @Column(nullable = false, length = 30)
    private String unit;

    @Column(nullable = false, length = 20)
    private String aggregation;

    @Column(nullable = false)
    private boolean active;
}

package vandinh.wisebot.billingservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import vandinh.wisebot.billingservice.common.response.ApiResponse;
import vandinh.wisebot.billingservice.config.VietQRConfig;
import vandinh.wisebot.billingservice.dto.request.VietQRConfigRequest;
import vandinh.wisebot.billingservice.dto.response.VietQRConfigResponse;

import java.util.Map;

@RestController
@RequestMapping("/system-config")
@RequiredArgsConstructor
public class SystemConfigController {

    private final VietQRConfig vietQRConfig;
    private final RestTemplate restTemplate;

    @GetMapping("/vietqr/banks")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseEntity<?> getVietQRBanks() {
        try {
            var response = restTemplate.getForObject("https://api.vietqr.io/v2/banks", Map.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Cannot fetch banks"));
        }
    }

    @GetMapping("/vietqr")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse getVietQRConfig() {
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("VietQR config")
                .data(VietQRConfigResponse.builder()
                        .bankCode(vietQRConfig.getBankCode())
                        .accountNo(vietQRConfig.getAccountNo())
                        .accountName(vietQRConfig.getAccountName())
                        .template(vietQRConfig.getTemplate())
                        .build())
                .build();
    }

    @PutMapping("/vietqr")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ApiResponse updateVietQRConfig(@Valid @RequestBody VietQRConfigRequest request) {
        if (request.getBankCode() != null && !request.getBankCode().isBlank())
            vietQRConfig.setBankCode(request.getBankCode());
        if (request.getAccountNo() != null)
            vietQRConfig.setAccountNo(request.getAccountNo());
        if (request.getAccountName() != null)
            vietQRConfig.setAccountName(request.getAccountName());

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("VietQR config updated")
                .data(VietQRConfigResponse.builder()
                        .bankCode(vietQRConfig.getBankCode())
                        .accountNo(vietQRConfig.getAccountNo())
                        .accountName(vietQRConfig.getAccountName())
                        .template(vietQRConfig.getTemplate())
                        .build())
                .build();
    }
}

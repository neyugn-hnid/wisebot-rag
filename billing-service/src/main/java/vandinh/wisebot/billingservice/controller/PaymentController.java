package vandinh.wisebot.billingservice.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vandinh.wisebot.billingservice.common.response.ApiResponse;
import vandinh.wisebot.billingservice.dto.request.CreateVNPayCheckoutRequest;
import vandinh.wisebot.billingservice.exception.InvalidDataException;
import vandinh.wisebot.billingservice.service.VNPayService;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;

    @PostMapping("/vnpay/checkout")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse createCheckout(@Valid @RequestBody CreateVNPayCheckoutRequest request,
                                      @RequestHeader(value = "X-Tenant-Id", required = false) String tenantIdHeader,
                                      HttpServletRequest servletRequest) {
        UUID tenantId = parseTenantId(tenantIdHeader);

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("VNPay checkout created")
                .data(vnPayService.createCheckout(request, tenantId, extractClientIp(servletRequest)))
                .build();
    }

    @GetMapping("/vnpay-return")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','FINANCE','USER')")
    public ApiResponse vnpayReturn(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String name = paramNames.nextElement();
            params.put(name, request.getParameter(name));
        }

        var result = vnPayService.handleReturn(params);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message(result.getStatus())
                .data(result)
                .build();
    }

    private UUID parseTenantId(String tenantIdHeader) {
        if (!StringUtils.hasText(tenantIdHeader)) {
            throw new InvalidDataException("Missing tenant header");
        }
        try {
            return UUID.fromString(tenantIdHeader.trim());
        } catch (IllegalArgumentException ex) {
            throw new InvalidDataException("Invalid tenant header");
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

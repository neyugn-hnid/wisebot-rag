package vandinh.wisebot.billingservice.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vandinh.wisebot.billingservice.common.response.ApiResponse;
import vandinh.wisebot.billingservice.service.VNPayService;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final VNPayService vnPayService;

    @PostMapping("/create-payment-url")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER','USER')")
    public ApiResponse createPaymentUrl(@RequestBody Map<String, Object> request) {
        long amount = ((Number) request.get("amount")).longValue();
        String orderInfo = (String) request.get("orderInfo");
        String orderId = (String) request.get("orderId");

        String paymentUrl = vnPayService.createPaymentUrl(amount, orderInfo, orderId);

        Map<String, String> result = new HashMap<>();
        result.put("paymentUrl", paymentUrl);

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Payment URL created")
                .data(result)
                .build();
    }

    @GetMapping("/vnpay-return")
    public ApiResponse vnpayReturn(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String name = paramNames.nextElement();
            params.put(name, request.getParameter(name));
        }

        boolean isValid = vnPayService.verifyReturn(params);

        Map<String, Object> result = new HashMap<>();
        result.put("valid", isValid);
        result.put("transactionId", params.get("vnp_TransactionNo"));
        result.put("orderId", params.get("vnp_TxnRef"));
        result.put("amount", params.get("vnp_Amount"));
        result.put("responseCode", params.get("vnp_ResponseCode"));

        String status = "00".equals(params.get("vnp_ResponseCode")) ? "SUCCESS" : "FAILED";
        result.put("status", status);

        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message(status)
                .data(result)
                .build();
    }
}

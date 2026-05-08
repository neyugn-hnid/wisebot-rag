package vandinh.wisebot.userservice.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Email;
import com.sendgrid.helpers.mail.objects.Personalization;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vandinh.wisebot.userservice.entity.EmailLog;
import vandinh.wisebot.userservice.repository.EmailLogRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@Slf4j(topic = "EMAIL-SERVICE")
@RequiredArgsConstructor
public class EmailService {
    private final EmailLogRepository emailLogRepository;

    @Value("${spring.sendGrid.apiKey}")
    private String sendgridApiKey;

    @Value("${spring.sendGrid.fromEmail}")
    private String fromEmail;

    @Value("${spring.sendGrid.templateId}")
    private String verifyTemplateId;

    @Value("${spring.sendGrid.resetTemplateId:#{null}}")
    private String resetTemplateId;

    private void send(String to, String templateId, Map<String, Object> params) {
        EmailLog log = EmailLog.builder()
                .recipient(to)
                .templateId(templateId)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        emailLogRepository.save(log);

        Email from = new Email(fromEmail);
        Email toEmail = new Email(to);

        Mail mail = new Mail();
        mail.setFrom(from);
        mail.setTemplateId(templateId);

        Personalization personalization = new Personalization();
        personalization.addTo(toEmail);
        if (params != null) {
            params.forEach(personalization::addDynamicTemplateData);
        }
        mail.addPersonalization(personalization);

        SendGrid sg = new SendGrid(sendgridApiKey);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.setStatus("SEND");
                log.setSentAt(LocalDateTime.now());
            } else {
                log.setStatus("FAILED");
                log.setErrorMessage(response.getBody());
            }
        } catch (IOException e) {
            log.setStatus("FAILED");
            log.setErrorMessage(e.getMessage());
        }
        emailLogRepository.save(log);
    }


    public void sendVerificationEmail(String to, String title, String fullName, String otpCode) {
        Map<String, Object> params = Map.of(
                "title", title,
                "full_name", fullName,
                "otp_code", otpCode
        );
        send(to, verifyTemplateId, params);
    }


    public void sendResetPasswordEmail(String to, String title, String fullName, String otpCode) {
        Map<String, Object> params = Map.of(
                "title", title,
                "full_name", fullName,
                "otp_code", otpCode
        );
        String templateId = resetTemplateId != null && !resetTemplateId.isBlank()
                ? resetTemplateId
                : verifyTemplateId;
        send(to, templateId, params);
    }
}
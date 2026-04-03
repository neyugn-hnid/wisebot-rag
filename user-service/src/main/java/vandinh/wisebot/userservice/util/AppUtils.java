package vandinh.wisebot.userservice.util;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import vandinh.wisebot.userservice.entity.UserEntity;
import vandinh.wisebot.userservice.exception.ResourceNotFoundException;
import vandinh.wisebot.userservice.repository.UserRepository;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class AppUtils {

    private static UserRepository userRepository;

    public static Sort.Order getSortOrder(String sort) {
        if (sort == null) return new Sort.Order(Sort.Direction.ASC, "id");
        Matcher matcher = Pattern.compile("(\\w+?)(:)(asc|desc)").matcher(sort);
        if (matcher.find()) {
            return new Sort.Order(
                    matcher.group(3).equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC,
                    matcher.group(1)
            );
        }
        return new Sort.Order(Sort.Direction.ASC, "id");
    }

    public static String generateOtp() {
        return String.valueOf((int)(Math.random() * 900000) + 100000);
    }

    public static UserEntity getUserEntity(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}

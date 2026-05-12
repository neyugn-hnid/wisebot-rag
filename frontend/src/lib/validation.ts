export const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_REGEX = /^[0-9]{6}$/;
const PASSWORD_WITH_UPPERCASE_AND_DIGIT_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_ALLOWED_CHARS_REGEX = /^\+?[0-9\s()-]{8,20}$/;

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidGmail(value: string) {
  return GMAIL_REGEX.test(value.trim());
}

export function isValidOtp(value: string) {
  return OTP_REGEX.test(value.trim());
}

export function isStrongPassword(value: string) {
  return PASSWORD_WITH_UPPERCASE_AND_DIGIT_REGEX.test(value);
}

export function hasMinLength(value: string, min: number) {
  return value.length >= min;
}

export function isValidPhone(value: string) {
  const trimmed = value.trim();
  if (!PHONE_ALLOWED_CHARS_REGEX.test(trimmed)) {
    return false;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

export function looksLikeEmail(value: string) {
  return value.includes('@');
}

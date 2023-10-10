export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  // Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
  return passwordRegex.test(password);
}

export function validateName(name) {
  // Allow alphabetical characters, spaces, hyphens, and apostrophes
  return /^[A-Za-z\s'-]+$/.test(name);
}

export function validateConfirmPassword(password, confirmPassword) {
  return password === confirmPassword;
}

export function validatePhone(phone) {
  return /^\d{3}-\d{3}-\d{4}$/.test(phone);
}

export const Validators = {
  email(value: string): string | null {
    if (!value) return "Email is required";
    const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!re.test(value)) return "Enter a valid email";
    return null;
  },

  password(value: string): string | null {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return null;
  },

  confirmPassword(value: string, password: string): string | null {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return null;
  },

  required(value: string, field = "This field"): string | null {
    if (!value || !value.trim()) return `${field} is required`;
    return null;
  },

  phone(value: string): string | null {
    if (!value) return "Phone number is required";
    if (value.length < 10) return "Enter a valid phone number";
    return null;
  },

  accountNumber(value: string): string | null {
    if (!value) return "Account number is required";
    if (value.length < 6) return "Enter a valid account number (min 6 digits)";
    return null;
  },

  ifscCode(value: string): string | null {
    if (!value) return "IFSC code is required";
    const re = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!re.test(value.toUpperCase())) return "Enter a valid IFSC code";
    return null;
  },

  cardNumber(value: string): string | null {
    if (!value) return "Card number is required";
    if (value.replace(/\s/g, "").length < 16) return "Enter a valid 16-digit card number";
    return null;
  },

  cvv(value: string): string | null {
    if (!value) return "CVV is required";
    if (value.length < 3) return "Enter a valid 3-digit CVV";
    return null;
  },

  amount(value: string): string | null {
    if (!value) return "Amount is required";
    const n = parseFloat(value);
    if (Number.isNaN(n) || n <= 0) return "Enter a valid amount";
    return null;
  },
};

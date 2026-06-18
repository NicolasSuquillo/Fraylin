import type { CheckoutCustomer } from "@/types";

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutCustomer, string>>;

const NAME_PATTERN = /^[\p{L}\s'.-]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeEcuadorPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("593")) {
    digits = `0${digits.slice(3)}`;
  }
  if (digits.length === 9 && digits.startsWith("9")) {
    digits = `0${digits}`;
  }
  if (!/^0[2-9]\d{7,8}$/.test(digits)) {
    return null;
  }
  return digits;
}

export function validateCheckoutCustomer(
  customer: Partial<CheckoutCustomer>
): { valid: true; normalized: CheckoutCustomer } | { valid: false; errors: CheckoutFieldErrors } {
  const errors: CheckoutFieldErrors = {};

  const name = customer.name?.trim() ?? "";
  if (!name) {
    errors.name = "Ingresa tu nombre completo";
  } else if (name.length < 3) {
    errors.name = "El nombre debe tener al menos 3 caracteres";
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = "El nombre solo puede contener letras";
  } else if (name.split(/\s+/).filter(Boolean).length < 2) {
    errors.name = "Ingresa nombre y apellido";
  }

  const phoneRaw = customer.phone?.trim() ?? "";
  const normalizedPhone = phoneRaw ? normalizeEcuadorPhone(phoneRaw) : null;
  if (!phoneRaw) {
    errors.phone = "Ingresa tu número de teléfono";
  } else if (!normalizedPhone) {
    errors.phone = "Ingresa un teléfono ecuatoriano válido (ej. 098 4025 792)";
  }

  const email = customer.email?.trim() ?? "";
  if (!email) {
    errors.email = "Ingresa tu correo electrónico";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Ingresa un correo electrónico válido";
  }

  const address = customer.address?.trim() ?? "";
  if (!address) {
    errors.address = "Ingresa tu dirección de entrega";
  } else if (address.length < 10) {
    errors.address = "La dirección debe ser más detallada (mín. 10 caracteres)";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    normalized: {
      name,
      phone: normalizedPhone!,
      email: email.toLowerCase(),
      address,
    },
  };
}

export function firstCheckoutError(errors: CheckoutFieldErrors): string {
  return errors.name ?? errors.phone ?? errors.email ?? errors.address ?? "Datos del cliente inválidos";
}

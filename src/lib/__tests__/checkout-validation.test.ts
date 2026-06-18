import { describe, expect, it } from "vitest";
import { firstCheckoutError, validateCheckoutCustomer } from "@/lib/checkout-validation";

const validCustomer = {
  name: "Juan Pérez",
  phone: "098 4025 792",
  email: "Juan@Example.com",
  address: "Av. Amazonas N24-03 y Colón, Quito",
};

describe("validateCheckoutCustomer", () => {
  it("acepta un cliente válido y normaliza teléfono y email", () => {
    const result = validateCheckoutCustomer(validCustomer);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.normalized.phone).toBe("0984025792");
      expect(result.normalized.email).toBe("juan@example.com");
    }
  });

  it("normaliza teléfonos con prefijo +593", () => {
    const result = validateCheckoutCustomer({ ...validCustomer, phone: "+593 98 402 5792" });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.normalized.phone).toBe("0984025792");
  });

  it("normaliza celulares de 9 dígitos sin cero inicial", () => {
    const result = validateCheckoutCustomer({ ...validCustomer, phone: "984025792" });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.normalized.phone).toBe("0984025792");
  });

  it("rechaza teléfonos no ecuatorianos", () => {
    for (const phone of ["12345", "0114025792", "555-123-4567", "abc"]) {
      const result = validateCheckoutCustomer({ ...validCustomer, phone });
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.errors.phone).toBeTruthy();
    }
  });

  it("exige nombre y apellido", () => {
    const result = validateCheckoutCustomer({ ...validCustomer, name: "Juan" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.name).toBeTruthy();
  });

  it("rechaza nombres con caracteres no permitidos", () => {
    const result = validateCheckoutCustomer({ ...validCustomer, name: "Juan <script>" });
    expect(result.valid).toBe(false);
  });

  it("rechaza emails inválidos", () => {
    for (const email of ["", "no-arroba", "a@b", "a @b.com"]) {
      const result = validateCheckoutCustomer({ ...validCustomer, email });
      expect(result.valid).toBe(false);
    }
  });

  it("exige dirección detallada", () => {
    const result = validateCheckoutCustomer({ ...validCustomer, address: "Quito" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.address).toBeTruthy();
  });

  it("acumula errores de todos los campos vacíos", () => {
    const result = validateCheckoutCustomer({});
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(Object.keys(result.errors).sort()).toEqual(["address", "email", "name", "phone"]);
    }
  });
});

describe("firstCheckoutError", () => {
  it("devuelve el primer error en orden de campos", () => {
    expect(firstCheckoutError({ email: "e", name: "n" })).toBe("n");
    expect(firstCheckoutError({})).toBe("Datos del cliente inválidos");
  });
});

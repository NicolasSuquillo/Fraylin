const CONFIRM_URL = "https://paymentbox.payphonetodoesposible.com/api/confirm";
// Reverso de un cobro aprobado (devuelve el monto al cliente). Endpoint oficial
// por id de Payphone. Sólo el mismo día hasta las 20:00 EC. Éxito retorna `true`.
const REVERSE_URL = "https://pay.payphonetodoesposible.com/api/Reverse";

export interface PayphoneConfirmResponse {
  statusCode: number; // 2 = Canceled, 3 = Approved
  transactionStatus: string; // "Approved" | "Canceled"
  transactionId: number;
  clientTransactionId: string;
  authorizationCode?: string;
  // Montos realmente procesados por Payphone, en centavos. Se usan para
  // verificar que el cobro coincide con el total persistido (anti-fraude).
  amount?: number;
  amountWithTax?: number;
  amountWithoutTax?: number;
  tax?: number;
  [key: string]: unknown;
}

export async function confirmPayphoneTransaction(
  id: number,
  clientTxId: string
): Promise<PayphoneConfirmResponse> {
  const token = process.env.PAYPHONE_TOKEN;
  if (!token) {
    throw new Error("PAYPHONE_TOKEN no configurado");
  }

  const res = await fetch(CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, clientTxId }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payphone Confirm falló (${res.status}): ${text}`);
  }

  const data: PayphoneConfirmResponse = await res.json();
  if (typeof data.statusCode !== "number" || data.transactionId == null) {
    throw new Error(`Payphone Confirm devolvió una respuesta incompleta: ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Reversa un cobro aprobado en Payphone (devuelve el monto al cliente).
 * Se usa cuando el pago fue aprobado pero la orden no puede cumplirse
 * (ej: stock agotado por una compra concurrente, o monto manipulado), para no
 * cobrar sin entregar. La API responde `true` en éxito o `{message,errorCode}`
 * en error. Lanza si el reverso no se confirmó, para que el llamador alerte.
 * Restricción Payphone: sólo el mismo día hasta las 20:00 EC.
 */
export async function reversePayphoneTransaction(transactionId: number): Promise<true> {
  const token = process.env.PAYPHONE_TOKEN;
  if (!token) {
    throw new Error("PAYPHONE_TOKEN no configurado");
  }

  const res = await fetch(REVERSE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: transactionId }),
    signal: AbortSignal.timeout(15_000),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Payphone Reverse falló (${res.status}): ${text}`);
  }

  // Éxito documentado: el cuerpo es literalmente `true`. Cualquier otra cosa
  // (ej. {message, errorCode}) es un fallo aunque el HTTP sea 200.
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  if (parsed !== true) {
    throw new Error(`Payphone Reverse no confirmado: ${text}`);
  }
  return true;
}

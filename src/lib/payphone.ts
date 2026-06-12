const CONFIRM_URL = "https://paymentbox.payphonetodoesposible.com/api/confirm";

export interface PayphoneConfirmResponse {
  statusCode: number; // 2 = Canceled, 3 = Approved
  transactionStatus: string; // "Approved" | "Canceled"
  transactionId: number;
  clientTransactionId: string;
  authorizationCode?: string;
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

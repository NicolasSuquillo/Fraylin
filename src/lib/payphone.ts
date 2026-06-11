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
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payphone Confirm falló (${res.status}): ${text}`);
  }

  return res.json();
}

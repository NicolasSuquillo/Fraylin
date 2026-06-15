import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/admin-auth";
import { getTransferSettings, updateTransferSettings } from "@/lib/pricing";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json(await getTransferSettings());
}

export async function PUT(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }

  const { enabled, qrImageUrl, bankName, accountType, accountNumber, accountHolder, accountId, instructions } =
    body as {
      enabled?: boolean;
      qrImageUrl?: string | null;
      bankName?: string;
      accountType?: string;
      accountNumber?: string;
      accountHolder?: string;
      accountId?: string;
      instructions?: string;
    };

  if (qrImageUrl !== null && typeof qrImageUrl !== "string") {
    return NextResponse.json({ error: "QR inválido" }, { status: 400 });
  }

  const textFields = { bankName, accountType, accountNumber, accountHolder, accountId, instructions };
  for (const [key, value] of Object.entries(textFields)) {
    if (typeof value !== "string") {
      return NextResponse.json({ error: `Falta el campo "${key}"` }, { status: 400 });
    }
  }

  await updateTransferSettings({
    enabled: enabled !== false,
    qrImageUrl: qrImageUrl ?? null,
    bankName: bankName!.trim(),
    accountType: accountType!.trim(),
    accountNumber: accountNumber!.trim(),
    accountHolder: accountHolder!.trim(),
    accountId: accountId!.trim(),
    instructions: instructions!.trim(),
  });
  revalidatePath("/checkout");
  return NextResponse.json({ ok: true });
}

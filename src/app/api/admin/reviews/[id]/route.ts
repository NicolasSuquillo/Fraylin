import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { setReviewApproval, deleteReview } from "@/lib/reviews";
import { tryDeletePublicUpload } from "@/lib/delete-public-upload";
import { revalidatePath } from "next/cache";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: { approved?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  if (typeof body.approved !== "boolean") {
    return NextResponse.json({ error: "Campo 'approved' inválido" }, { status: 400 });
  }
  const res = await setReviewApproval(numId, body.approved);
  if (!res.found) {
    return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  }
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/orders");
  if (res.orderId) {
    revalidatePath(`/admin/orders/${res.orderId}`);
  }
  if (res.clientTransactionId) {
    revalidatePath(`/seguimiento/${res.clientTransactionId}`);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const res = await deleteReview(numId);
  if (!res.found) {
    return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  }
  if (res.avatarUrl) await tryDeletePublicUpload(res.avatarUrl);
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/orders");
  if (res.orderId) {
    revalidatePath(`/admin/orders/${res.orderId}`);
  }
  if (res.clientTransactionId) {
    revalidatePath(`/seguimiento/${res.clientTransactionId}`);
  }
  return NextResponse.json({ ok: true });
}

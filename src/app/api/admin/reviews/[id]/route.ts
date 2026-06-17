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
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { approved } = (await req.json()) as { approved: boolean };
  await setReviewApproval(numId, approved);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const avatarUrl = await deleteReview(numId);
  if (avatarUrl) await tryDeletePublicUpload(avatarUrl);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}

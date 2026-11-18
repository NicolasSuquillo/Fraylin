import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { tryDeletePublicUpload } from "@/lib/delete-public-upload";
import { detectImageType, extensionForImageType } from "@/lib/image-sniff";
import { getOrderByClientTransactionId } from "@/lib/orders";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createOrderVerifiedReview } from "@/lib/reviews";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const RATE_LIMIT_MAX = 6;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_AUTHOR_NAME = 80;
const MAX_BODY = 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!checkRateLimit(`tracking-review:${getClientIp(req)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Demasiados intentos seguidos. Intenta de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  const { code } = await params;
  const normalizedCode = code.trim().toUpperCase();
  if (!/^FR[A-Z0-9]{6,32}$/.test(normalizedCode)) {
    return NextResponse.json({ error: "Código de pedido inválido" }, { status: 400 });
  }

  const order = await getOrderByClientTransactionId(normalizedCode);
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (order.status !== "paid" || order.fulfillmentStatus !== "entregado") {
    return NextResponse.json(
      { error: "Solo puedes calificar el pedido una vez que haya sido pagado y entregado." },
      { status: 400 }
    );
  }
  if (order.review) {
    return NextResponse.json(
      { error: "Este pedido ya cuenta con una reseña registrada." },
      { status: 409 }
    );
  }

  const form = await req.formData();
  const phoneLast4 = (form.get("phoneLast4") as string | null)?.replace(/\D/g, "") ?? "";
  const authorNameInput = (form.get("authorName") as string | null)?.trim() ?? "";
  const ratingRaw = form.get("rating") as string | null;
  const body = (form.get("body") as string | null)?.trim() ?? "";
  const avatarRaw = form.get("avatar");
  const avatar = avatarRaw instanceof File ? avatarRaw : null;

  const orderDigits = order.customerPhone.replace(/\D/g, "");
  if (phoneLast4.length !== 4 || !orderDigits.endsWith(phoneLast4)) {
    return NextResponse.json(
      { error: "Los últimos 4 dígitos del teléfono no coinciden con el pedido." },
      { status: 403 }
    );
  }

  const authorName = authorNameInput || order.customerName;
  if (!authorName || authorName.length > MAX_AUTHOR_NAME) {
    return NextResponse.json(
      { error: `El nombre debe tener entre 1 y ${MAX_AUTHOR_NAME} caracteres.` },
      { status: 400 }
    );
  }
  if (body.length < 10 || body.length > MAX_BODY) {
    return NextResponse.json(
      { error: `La reseña debe tener entre 10 y ${MAX_BODY} caracteres.` },
      { status: 400 }
    );
  }

  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Calificación inválida (1-5)" }, { status: 400 });
  }

  let avatarUrl: string | undefined;
  try {
    if (avatar && avatar.size > 0) {
      if (avatar.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "La imagen supera los 2 MB" }, { status: 413 });
      }
      const detectedType = await detectImageType(avatar);
      if (!detectedType) {
        return NextResponse.json(
          { error: "El archivo no es una imagen válida (JPG, PNG, WEBP o GIF)" },
          { status: 400 }
        );
      }
      const ext = extensionForImageType(detectedType);
      const filename = `${Date.now()}-${normalizedCode.toLowerCase()}${ext}`;
      const blob = await put(`reviews/${filename}`, avatar, {
        access: "public",
        addRandomSuffix: true,
        contentType: detectedType,
      });
      avatarUrl = blob.url;
    }

    const review = await createOrderVerifiedReview({
      orderId: order.id,
      clientTransactionId: order.clientTransactionId,
      authorName,
      rating,
      body,
      avatarUrl,
      actor: "cliente",
    });

    revalidatePath(`/seguimiento/${order.clientTransactionId}`);
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath("/admin/reviews");
    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (err) {
    if (avatarUrl) {
      await tryDeletePublicUpload(avatarUrl);
    }
    if (err instanceof Error && err.message === "REVIEW_ALREADY_EXISTS") {
      return NextResponse.json(
        { error: "Este pedido ya cuenta con una reseña registrada." },
        { status: 409 }
      );
    }
    if (err instanceof Error && (err.message === "INVALID_REVIEW" || err.message === "ORDER_CODE_MISMATCH")) {
      return NextResponse.json(
        { error: "Datos de reseña inválidos" },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message === "ORDER_NOT_DELIVERED") {
      return NextResponse.json(
        { error: "Solo puedes calificar el pedido una vez que haya sido pagado y entregado." },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    console.error("[tracking/review] Error guardando reseña:", err);
    return NextResponse.json({ error: "No se pudo guardar la reseña." }, { status: 500 });
  }
}


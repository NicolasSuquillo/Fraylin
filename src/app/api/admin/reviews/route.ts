import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/admin-auth";
import { getAllReviews } from "@/lib/reviews";

export async function GET(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const all = await getAllReviews();
  const filtered =
    status === "pending"
      ? all.filter((r) => !r.approved)
      : status === "approved"
        ? all.filter((r) => r.approved)
        : all;

  return NextResponse.json(filtered);
}

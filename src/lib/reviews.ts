import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Review } from "@/types";

function mapRow(r: typeof reviews.$inferSelect): Review {
  return {
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    body: r.body,
    avatarUrl: r.avatarUrl,
    approved: r.approved,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getApprovedReviews(): Promise<Review[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.createdAt));
  return rows.map(mapRow);
}

export async function getAllReviews(): Promise<Review[]> {
  const rows = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  return rows.map(mapRow);
}

export async function createReview(data: {
  authorName: string;
  rating: number;
  body: string;
  avatarUrl?: string;
}): Promise<Review> {
  const [row] = await db
    .insert(reviews)
    .values({ ...data, approved: false })
    .returning();
  return mapRow(row);
}

export async function setReviewApproval(id: number, approved: boolean): Promise<void> {
  await db.update(reviews).set({ approved }).where(eq(reviews.id, id));
}

export async function deleteReview(id: number): Promise<string | null> {
  const [row] = await db.delete(reviews).where(eq(reviews.id, id)).returning();
  return row?.avatarUrl ?? null;
}

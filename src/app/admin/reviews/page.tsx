import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getAllReviews } from "@/lib/reviews";
import ReviewsManager from "./ReviewsManager";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const reviews = await getAllReviews();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reseñas</h1>
      <ReviewsManager reviews={reviews} />
    </div>
  );
}

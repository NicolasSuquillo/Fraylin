import { getSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { getGalleryItems } from "@/lib/gallery";
import GalleryManager from "./GalleryManager";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  const items = await getGalleryItems();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Galería de trabajos</h1>
      <p className="text-gray-600 text-sm mb-6">
        Administra las fotos que se muestran en la página principal (sección Galería).
      </p>
      <GalleryManager initialItems={items} />
    </div>
  );
}

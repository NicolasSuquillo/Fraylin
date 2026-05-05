import { redirect } from "next/navigation";
import { getSession } from "@/lib/admin-auth";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminNav />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/categories", label: "Categorías" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-login");
  }

  return (
    <aside className="w-48 bg-white border-r border-gray-200 flex flex-col py-8 px-4">
      <p className="text-lg font-bold text-amber-700 mb-8">Fraylin Admin</p>
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
              pathname.startsWith(href)
                ? "bg-amber-100 text-amber-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-red-600 text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        Cerrar sesión
      </button>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const tabs = [
    { href: "/", label: "Home" },
    { href: "/today", label: "Today" },
    { href: "/week", label: "Week" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium sm:px-3 ${
                pathname === t.href
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800 sm:px-3"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

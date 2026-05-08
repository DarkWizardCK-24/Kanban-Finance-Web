"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FaChartLine, FaBuildingColumns, FaTableCellsLarge, FaUser,
  FaRightFromBracket,
} from "react-icons/fa6";
import { useAuth } from "@/lib/authContext";
import { AuthService } from "@/lib/authService";
import { Avatar } from "@/components/common/Avatar";
import { userInitials } from "@/lib/models";
import { Loading } from "@/components/common/Loading";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  { href: "/home",     label: "Dashboard", icon: <FaChartLine size={18} /> },
  { href: "/accounts", label: "Accounts",  icon: <FaBuildingColumns size={18} /> },
  { href: "/kanban",   label: "Kanban",    icon: <FaTableCellsLarge size={18} /> },
  { href: "/profile",  label: "Profile",   icon: <FaUser size={18} /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { firebaseUser, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/login");
  }, [loading, firebaseUser, router]);

  if (loading || !user) {
    return <main className="flex min-h-screen items-center justify-center bg-dark-bg"><Loading message="Loading..." /></main>;
  }

  async function onLogout() {
    await AuthService.logout();
    router.replace("/login");
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg lg:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-dark-border bg-dark-surface lg:flex">
        <div className="flex items-center gap-3 border-b border-dark-border px-5 py-5">
          <Avatar initials={userInitials(user.name)} size={40} onClick={() => router.push("/profile")} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text-primary">Hello, {firstName}</p>
            <p className="text-[11px] font-medium text-accent-cyan">🔒 Vault Finance</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "bg-accent-cyan/10 text-accent-cyan" : "text-text-secondary hover:bg-dark-card hover:text-text-primary"
                }`}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-dark-border p-3">
          <button onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-text-secondary hover:bg-dark-card hover:text-accent-red">
            <FaRightFromBracket size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile / tablet top bar */}
        <header className="sticky top-0 z-30 border-b border-dark-border bg-dark-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <Avatar initials={userInitials(user.name)} size={36} onClick={() => router.push("/profile")} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-primary">Hello, {firstName}</p>
              <p className="text-[11px] font-medium text-accent-cyan">🔒 Vault Finance</p>
            </div>
            <button onClick={onLogout} aria-label="Logout"
              className="rounded-lg p-2 text-text-secondary hover:bg-dark-card hover:text-accent-red focus-ring">
              <FaRightFromBracket size={17} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-24 lg:pb-8">{children}</main>

        {/* Bottom nav (mobile/tablet) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-dark-border bg-dark-surface/95 backdrop-blur lg:hidden">
          <ul className="grid grid-cols-4">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                      active ? "text-accent-cyan" : "text-text-hint"
                    }`}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

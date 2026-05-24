import Link from "next/link";
import { signOut } from "../../../auth";
import { DashboardNav } from "./dashboard-nav";
import type { Plan } from "@prisma/client";

type AppShellProps = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    plan: Plan;
  };
  children: React.ReactNode;
};

async function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        退出登录
      </button>
    </form>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-primary">
              FBA
            </Link>
            <DashboardNav />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user.email ?? user.name ?? "User"}
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-primary">
              {user.plan}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

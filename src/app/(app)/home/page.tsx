"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaPlus } from "react-icons/fa6";
import { useAuth } from "@/lib/authContext";
import { watchBankAccounts, getWealthSummary } from "@/lib/firestoreService";
import { type BankAccountModel, AccountCategoryMeta, type AccountCategory } from "@/lib/models";
import { type WealthSummary } from "@/lib/wealth";
import { WealthSummaryCard } from "@/components/bank/WealthSummaryCard";
import { BankCard } from "@/components/bank/BankCard";
import { Loading } from "@/components/common/Loading";
import { Formatters } from "@/lib/formatters";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccountModel[] | null>(null);
  const [summary, setSummary] = useState<WealthSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = watchBankAccounts(user.uid, async (accs) => {
      setAccounts(accs);
      try { setSummary(await getWealthSummary(user.uid)); } catch {}
    });
    return unsub;
  }, [user]);

  if (!user) return null;

  const grouped = new Map<AccountCategory, number>();
  (accounts ?? []).forEach((a) => {
    grouped.set(a.category, (grouped.get(a.category) ?? 0) + a.totalAmount);
  });
  const breakdown = Array.from(grouped.entries());

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      {/* Wealth */}
      {summary
        ? <WealthSummaryCard summary={summary} />
        : <div className="h-44 animate-pulse rounded-2xl border border-dark-border bg-wealth-gradient" />}

      {/* Category breakdown */}
      {breakdown.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-text-primary">
            <span>📊</span> Category Breakdown
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {breakdown.map(([cat, total]) => (
              <div key={cat} className="surface-card px-3 py-2.5 shadow-card">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
                  <span>{AccountCategoryMeta[cat].emoji}</span>
                  <span className="truncate">{AccountCategoryMeta[cat].label}</span>
                </div>
                <p className="mt-1 truncate text-base font-extrabold text-text-primary">
                  {Formatters.compactCurrency(total)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bank Accounts */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
            <span>🏦</span> Your Bank Accounts
          </h2>
          <Link href="/accounts" className="text-xs font-semibold text-accent-cyan hover:underline">
            View all
          </Link>
        </div>

        {accounts === null ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((a, i) => (
              <BankCard
                key={a.id}
                account={a}
                index={i}
                onClick={() => router.push(`/accounts/${a.id}`)}
              />
            ))}
            <Link href="/accounts/new"
              className="group flex h-[260px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-accent-cyan/40 bg-dark-card p-5 text-center transition-all hover:border-accent-cyan hover:bg-accent-cyan/5">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan">
                <FaPlus size={22} />
              </span>
              <p className="text-sm font-bold text-accent-cyan">Add Account</p>
              <p className="text-xs text-text-secondary">Connect a new bank account</p>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

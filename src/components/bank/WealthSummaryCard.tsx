"use client";

import { FaVault } from "react-icons/fa6";
import { Formatters } from "@/lib/formatters";
import type { WealthSummary } from "@/lib/wealth";

export function WealthSummaryCard({ summary }: { summary: WealthSummary }) {
  return (
    <div className="rounded-2xl border border-dark-border bg-gradient-to-br from-[#0D1B5E] to-[#090E1A] p-5 shadow-card animate-fade-in sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-cyan/30 bg-accent-cyan/15 text-accent-cyan">
          <FaVault size={15} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Total Wealth</p>
          <p className="text-[10px] text-accent-cyan/80">Secured Vault</p>
        </div>
      </div>

      <p className="mt-3 truncate text-3xl font-extrabold leading-tight text-white sm:text-4xl">
        {Formatters.currency(summary.totalWealth)}
      </p>

      <div className="my-4 h-px bg-dark-divider" />
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat emoji="📥" label="Monthly In"
          value={Formatters.compactCurrency(summary.monthlyInflow)} color="#4ADE80" />
        <Stat emoji="📤" label="Monthly Out"
          value={Formatters.compactCurrency(summary.monthlyOutflow)} color="#FBBF24" />
        <Stat emoji="📊" label="Net Flow"
          value={Formatters.compactCurrency(summary.netMonthlyFlow)}
          color={summary.netMonthlyFlow >= 0 ? "#4ADE80" : "#F87171"} />
      </div>

      <div className="my-4 h-px bg-dark-divider" />
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat emoji="💰" label="Savings"
          value={Formatters.compactCurrency(summary.totalSavings)} color="#4ADE80" />
        <Stat emoji="🔒" label="Fixed Dep."
          value={Formatters.compactCurrency(summary.totalFixed + summary.totalRecurring)} color="#4FC3F7" />
        <Stat emoji="📦" label="Other"
          value={Formatters.compactCurrency(
            summary.totalCurrent + summary.totalSalary + summary.totalNri + summary.totalBusiness + summary.totalExpenses,
          )} color="#FBBF24" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Mini text={`🏦 ${summary.totalAccounts} Accounts`} color="#4FC3F7" />
        <Mini text={`📋 ${summary.totalTransactions} Transactions`} color="#A78BFA" />
      </div>
    </div>
  );
}

function Stat({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[15px]">{emoji}</div>
      <p className="text-[10px] font-medium text-text-hint">{label}</p>
      <p className="text-[13px] font-bold truncate" style={{ color }}>{value}</p>
    </div>
  );
}

function Mini({ text, color }: { text: string; color: string }) {
  return (
    <span className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
      style={{ color, backgroundColor: `${color}1F`, borderColor: `${color}44` }}>
      {text}
    </span>
  );
}

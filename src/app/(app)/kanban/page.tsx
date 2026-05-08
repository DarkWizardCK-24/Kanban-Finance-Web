"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaTableCellsLarge, FaBuildingColumns, FaPlus } from "react-icons/fa6";
import { useAuth } from "@/lib/authContext";
import {
  watchBankAccounts, watchAllTransactions,
  moveTransactionToAccount, deleteTransaction,
} from "@/lib/firestoreService";
import {
  type BankAccountModel, type TransactionModel,
  AccountCategoryMeta, maskAccountNumber, maskCardNumber, type TransactionType,
} from "@/lib/models";
import { Formatters } from "@/lib/formatters";
import { bankGradientFor, CategoryGradients } from "@/lib/colors";
import { TransactionCard } from "@/components/kanban/TransactionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Loading } from "@/components/common/Loading";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";

export default function KanbanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [accounts, setAccounts] = useState<BankAccountModel[] | null>(null);
  const [txns, setTxns] = useState<TransactionModel[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TransactionModel | null>(null);

  useEffect(() => {
    if (!user) return;
    const a = watchBankAccounts(user.uid, setAccounts);
    const t = watchAllTransactions(user.uid, setTxns);
    return () => { a(); t(); };
  }, [user]);

  const grouped = useMemo(() => {
    const m = new Map<string, TransactionModel[]>();
    for (const t of txns) {
      const list = m.get(t.bankAccountId) ?? [];
      list.push(t);
      m.set(t.bankAccountId, list);
    }
    return m;
  }, [txns]);

  if (!user || accounts === null) return <Loading message="Loading kanban board..." />;

  if (accounts.length === 0) {
    return (
      <EmptyState emoji="📋" title="No Bank Accounts"
        subtitle="Add bank accounts to see them on the kanban board!"
        actionLabel="Add Bank Account"
        onAction={() => router.push("/accounts/new")} />
    );
  }

  const totalBalance = accounts.reduce((s, a) => s + a.totalAmount, 0);

  async function onDropToAccount(targetAccountId: string, txnId: string) {
    const t = txns.find((x) => x.id === txnId);
    if (!t || t.bankAccountId === targetAccountId) return;
    const target = accounts!.find((a) => a.id === targetAccountId);
    await moveTransactionToAccount(t, targetAccountId);
    if (target) toast.show(`Moved "${t.title}" → ${target.bankName}`, "info");
  }

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
          <FaTableCellsLarge size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-text-primary">Bank Kanban Board</h1>
          <p className="truncate text-[11px] text-text-hint">
            {accounts.length} accs · {txns.length} txns · {Formatters.compactCurrency(totalBalance)}
          </p>
        </div>
        <span className="hidden rounded-md border border-accent-cyan/25 bg-accent-cyan/12 px-2 py-1 text-[10px] font-semibold text-accent-cyan sm:inline">
          Drag to reassign
        </span>
      </div>

      <div className="-mx-4 overflow-x-auto pb-24 themed-scroll sm:mx-0">
        <div className="flex h-[70vh] min-h-[440px] items-stretch px-4 sm:px-0">
          {accounts.map((account) => (
            <BankColumn
              key={account.id}
              account={account}
              transactions={grouped.get(account.id) ?? []}
              onDropTxn={(id) => onDropToAccount(account.id, id)}
              onAddTxn={() => router.push(`/accounts/${account.id}/transactions/new`)}
              onTapHeader={() => router.push(`/accounts/${account.id}`)}
              onEditTxn={(t) => router.push(`/accounts/${account.id}/transactions/${t.id}/edit`)}
              onDeleteTxn={(t) => setConfirmDelete(t)}
              draggingId={draggingId}
              setDraggingId={setDraggingId}
            />
          ))}
        </div>
      </div>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        title="Delete Transaction?"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="btn-outline">Cancel</button>
            <button onClick={async () => {
              if (confirmDelete) {
                await deleteTransaction(confirmDelete);
                toast.show("Transaction deleted", "success");
              }
              setConfirmDelete(null);
            }} className="btn-danger">Delete</button>
          </>
        }>
        Delete &quot;{confirmDelete?.title}&quot; — {confirmDelete && Formatters.currency(confirmDelete.amount)}?
      </Modal>
    </div>
  );
}

function BankColumn({
  account, transactions, onDropTxn, onAddTxn, onTapHeader,
  onEditTxn, onDeleteTxn, draggingId, setDraggingId,
}: {
  account: BankAccountModel;
  transactions: TransactionModel[];
  onDropTxn: (id: string) => void;
  onAddTxn: () => void;
  onTapHeader: () => void;
  onEditTxn: (t: TransactionModel) => void;
  onDeleteTxn: (t: TransactionModel) => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
}) {
  const colors = (bankGradientFor(account.bankName) ?? CategoryGradients[account.category]) as readonly [string, string];
  const live = transactions.reduce((s, t) =>
    s + (t.status === "failed" || t.status === "cancelled" ? 0 :
      t.type === "credit" ? t.amount : -t.amount), 0);

  const counts = transactions.reduce<Record<TransactionType, number>>(
    (acc, t) => ({ ...acc, [t.type]: acc[t.type] + 1 }),
    { credit: 0, debit: 0 },
  );

  const [hovering, setHovering] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!hovering) setHovering(true); }}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHovering(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDropTxn(id);
      }}
      style={{
        borderColor: hovering ? colors[0] : "#253450",
        backgroundColor: hovering ? `${colors[0]}14` : "#090E1A",
        boxShadow: hovering ? `0 8px 22px ${colors[0]}33` : undefined,
      }}
      className="mr-3 flex w-[300px] shrink-0 flex-col self-stretch rounded-2xl border transition-colors"
    >
      <button onClick={onTapHeader}
        className="rounded-t-2xl px-3.5 py-3 text-left transition-opacity hover:opacity-95"
        style={{ background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)` }}>
        <div className="flex items-center gap-2 text-white">
          <FaBuildingColumns size={13} className="text-white/70" />
          <span className="flex-1 truncate text-sm font-bold">{account.bankName}</span>
          <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold">
            {AccountCategoryMeta[account.category].emoji} {AccountCategoryMeta[account.category].label}
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[10px] tracking-[0.15em] text-white/70">
          {account.hasCard ? maskCardNumber(account) : `ACCT: ${maskAccountNumber(account.accountNumber)}`}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-white/60">Balance</p>
            <p className="truncate text-lg font-extrabold text-white">{Formatters.currency(live)}</p>
          </div>
          <div className="text-right">
            <div className="flex gap-2 text-[11px] font-semibold text-white/70">
              <span>📥 {counts.credit}</span>
              <span>📤 {counts.debit}</span>
            </div>
            <p className="text-[9px] text-white/55">{transactions.length} txns</p>
          </div>
        </div>
      </button>

      <button onClick={onAddTxn}
        className="flex items-center justify-center gap-1.5 border-b border-dark-border py-2 text-[11px] font-semibold transition-opacity"
        style={{ color: colors[0], backgroundColor: `${colors[0]}14` }}>
        <FaPlus size={10} /> Add Transaction
      </button>

      {hovering && (
        <div className="py-1.5 text-center text-[11px] font-semibold" style={{ color: colors[0] }}>
          ⬇ Drop to move here
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 themed-scroll">
        {transactions.length === 0 ? (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="text-2xl">{hovering ? "📥" : "📋"}</span>
            <p className="text-xs" style={{ color: hovering ? colors[0] : "#4A5B7A", fontWeight: hovering ? 600 : 400 }}>
              {hovering ? "Drop here!" : "No transactions"}
            </p>
          </div>
        ) : (
          transactions.map((t, i) => (
            <TransactionCard key={t.id} txn={t} index={i}
              isDragging={draggingId === t.id}
              onEdit={() => onEditTxn(t)}
              onDelete={() => onDeleteTxn(t)}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", t.id);
                e.dataTransfer.effectAllowed = "move";
                setDraggingId(t.id);
              }}
              onDragEnd={() => setDraggingId(null)} />
          ))
        )}
      </div>
    </div>
  );
}

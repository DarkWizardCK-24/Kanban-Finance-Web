"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowLeft, FaPenToSquare, FaPlus, FaCreditCard, FaBookOpen,
  FaHashtag, FaBuildingColumns, FaShieldHalved, FaCalendarCheck,
  FaCopy, FaEye, FaEyeSlash, FaTableCellsLarge,
} from "react-icons/fa6";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import {
  type BankAccountModel, type TransactionModel, type TransactionStatus,
  AccountCategoryMeta, bankAccountFromMap, maskAccountNumber, maskCardNumber,
} from "@/lib/models";
import {
  watchTransactionsForBank, updateTransaction, deleteTransaction,
} from "@/lib/firestoreService";
import { Formatters } from "@/lib/formatters";
import { bankGradientFor, CategoryGradients, AppColors } from "@/lib/colors";
import { Loading } from "@/components/common/Loading";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { KanbanColumn, txnsByStatus } from "@/components/kanban/KanbanColumn";
import { TransactionCard } from "@/components/kanban/TransactionCard";

export default function BankDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [account, setAccount] = useState<BankAccountModel | null>(null);
  const [txns, setTxns] = useState<TransactionModel[]>([]);
  const [showAccount, setShowAccount] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TransactionModel | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    const unsub = onSnapshot(doc(firestore, "bank_accounts", params.id), (snap) => {
      setAccount(snap.exists() ? bankAccountFromMap(snap.data()) : null);
    });
    return unsub;
  }, [params?.id]);

  useEffect(() => {
    if (!params?.id) return;
    const unsub = watchTransactionsForBank(params.id, setTxns);
    return unsub;
  }, [params?.id]);

  const colors = useMemo(() => {
    if (!account) return ["#0D1B5E", "#090E1A"] as [string, string];
    return (bankGradientFor(account.bankName) ?? CategoryGradients[account.category]) as [string, string];
  }, [account]);

  if (!account) return <Loading message="Loading account..." />;

  const grouped = txnsByStatus(txns);
  const liveBalance = txns.reduce((sum, t) =>
    sum + (t.status === "failed" || t.status === "cancelled" ? 0 :
      t.type === "credit" ? t.amount : -t.amount), 0);

  function copy(value: string, label: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).then(() => toast.show(`${label} copied`, "success"));
    }
  }

  async function move(txnId: string, status: TransactionStatus) {
    const t = txns.find((x) => x.id === txnId);
    if (!t || t.status === status) return;
    await updateTransaction({ ...t, status });
    toast.show(`Moved to ${status}`, "info");
  }

  function onDropToStatus(targetStatus: TransactionStatus) {
    return (id: string) => move(id, targetStatus);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="rounded-lg p-2 text-text-primary hover:bg-dark-card focus-ring">
          <FaArrowLeft size={16} />
        </button>
        <h1 className="flex-1 truncate text-base font-bold text-text-primary sm:text-lg">
          <span className="mr-1 text-xl">{AccountCategoryMeta[account.category].emoji}</span>
          {account.bankName}
        </h1>
        <button onClick={() => router.push(`/accounts/${account.id}/edit`)}
          className="rounded-lg p-2 text-text-secondary hover:bg-dark-card hover:text-accent-cyan focus-ring"
          aria-label="Edit account">
          <FaPenToSquare size={14} />
        </button>
        <button onClick={() => router.push(`/accounts/${account.id}/transactions/new`)}
          className="btn-primary px-3 py-2 text-xs sm:text-sm">
          <FaPlus size={12} /> Add Transaction
        </button>
      </div>

      {/* Bank header */}
      <div className="rounded-2xl p-5 text-white shadow-card animate-fade-in"
        style={{
          background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
          boxShadow: `0 14px 28px ${colors[0]}66`,
        }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-white/70">Total Balance</p>
            <p className="mt-1 truncate text-3xl font-extrabold sm:text-4xl">{Formatters.currency(liveBalance)}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-md bg-white/20 px-2.5 py-1 text-[11px] font-semibold">{txns.length} txns</span>
            <span className="rounded-md bg-white/15 px-2.5 py-1 text-[11px]">
              {AccountCategoryMeta[account.category].emoji} {AccountCategoryMeta[account.category].label}
            </span>
          </div>
        </div>
        <div className="my-3 h-px bg-white/20" />
        <div className="flex flex-wrap gap-1.5">
          <Chip>🆔 {account.id}</Chip>
          <Chip>💳 {maskAccountNumber(account.accountNumber)}</Chip>
          {account.ifscCode && <Chip>🏛️ {account.ifscCode}</Chip>}
        </div>
      </div>

      {/* Credentials */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan">
            {account.hasCard ? <FaCreditCard size={13} /> : <FaBookOpen size={13} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary">
              {account.hasCard ? "Card & Account Credentials" : "Account Details"}
            </p>
            <p className="text-[10px] text-text-hint">
              {account.hasCard ? "Tap 👁 to reveal · Tap 📋 to copy" : "Tap 📋 to copy"}
            </p>
          </div>
          {!account.hasCard && (
            <span className="rounded-md border border-accent-gold/30 bg-accent-gold/15 px-2 py-0.5 text-[10px] font-semibold text-accent-gold">
              📖 Passbook
            </span>
          )}
        </div>
        <div className="border-t border-dark-divider" />

        <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
          <CredentialRow icon={<FaHashtag size={11} />} label="Account Number"
            value={showAccount ? account.accountNumber : maskAccountNumber(account.accountNumber)}
            onToggle={() => setShowAccount((s) => !s)} hidden={!showAccount}
            onCopy={() => copy(account.accountNumber, "Account number")} />

          <CredentialRow icon={<FaBuildingColumns size={11} />} label="IFSC Code"
            value={account.ifscCode || "—"}
            onCopy={account.ifscCode ? () => copy(account.ifscCode, "IFSC code") : undefined} />

          {account.hasCard && (
            <>
              <CredentialRow icon={<FaCreditCard size={11} />} label="Card Number"
                value={showCard
                  ? account.cardNumber.replace(/(.{4})/g, "$1 ").trim()
                  : maskCardNumber(account)}
                onToggle={() => setShowCard((s) => !s)} hidden={!showCard}
                onCopy={account.cardNumber ? () => copy(account.cardNumber, "Card number") : undefined} />

              <div className="grid grid-cols-2 gap-2">
                <CredentialRow icon={<FaShieldHalved size={11} />} label="CVV"
                  value={showCvv ? (account.cvv || "—") : "•••"}
                  onToggle={account.cvv ? () => setShowCvv((s) => !s) : undefined} hidden={!showCvv}
                  onCopy={account.cvv ? () => copy(account.cvv, "CVV") : undefined} />
                <CredentialRow icon={<FaCalendarCheck size={11} />} label="Valid Thru"
                  value={account.cardValidity ? Formatters.monthYear(account.cardValidity) : "—"} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kanban */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan">
            <FaTableCellsLarge size={12} />
          </span>
          <h2 className="text-base font-bold text-text-primary">Transaction Board</h2>
          <span className="ml-auto hidden text-[11px] italic text-text-hint sm:inline">Drag to move between columns</span>
        </div>

        {txns.length === 0 ? (
          <div className="surface-card flex flex-col items-center justify-center gap-2 px-6 py-16">
            <span className="text-5xl">📋</span>
            <p className="text-base font-semibold text-text-primary">No transactions yet</p>
            <p className="text-sm text-text-secondary">Tap + to add your first transaction</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto pb-24 themed-scroll sm:mx-0">
            <div className="flex h-[60vh] min-h-[420px] items-stretch px-4 sm:px-0">
              {(["pending", "processing", "completed", "failed"] as const).map((key) => {
                const meta = COL_META[key];
                const list = grouped[key];
                return (
                  <KanbanColumn key={key}
                    title={meta.title} emoji={meta.emoji}
                    headerColor={meta.color} background={meta.bg}
                    count={list.length}
                    onDrop={onDropToStatus(meta.target)}>
                    {list.map((t, i) => (
                      <TransactionCard key={t.id} txn={t} index={i}
                        isDragging={draggingId === t.id}
                        onEdit={() => router.push(`/accounts/${account.id}/transactions/${t.id}/edit`)}
                        onDelete={() => setConfirmDelete(t)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", t.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(t.id);
                        }}
                        onDragEnd={() => setDraggingId(null)} />
                    ))}
                  </KanbanColumn>
                );
              })}
            </div>
          </div>
        )}
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

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/85">{children}</span>;
}

function CredentialRow({
  icon, label, value, onToggle, hidden, onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onToggle?: () => void;
  hidden?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dark-border bg-dark-card-alt px-3 py-2.5">
      <span className="text-accent-cyan">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-text-hint">{label}</p>
        <p className="truncate text-xs font-semibold text-text-primary">{value}</p>
      </div>
      {onToggle && (
        <button onClick={onToggle} className="text-accent-cyan focus-ring" aria-label="Toggle visibility">
          {hidden ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
        </button>
      )}
      {onCopy && (
        <button onClick={onCopy} className="text-text-hint hover:text-accent-cyan focus-ring" aria-label="Copy">
          <FaCopy size={12} />
        </button>
      )}
    </div>
  );
}

const COL_META = {
  pending:    { title: "Pending",    emoji: "⏳", color: AppColors.accentAmber, bg: AppColors.kanbanPending,    target: "pending" as TransactionStatus },
  processing: { title: "Processing", emoji: "🔄", color: AppColors.primaryBlue, bg: AppColors.kanbanProcessing, target: "processing" as TransactionStatus },
  completed:  { title: "Completed",  emoji: "✅", color: AppColors.accentGreen, bg: AppColors.kanbanCompleted,  target: "completed" as TransactionStatus },
  failed:     { title: "Failed",     emoji: "❌", color: AppColors.accentRed,   bg: AppColors.kanbanFailed,     target: "failed" as TransactionStatus },
} as const;

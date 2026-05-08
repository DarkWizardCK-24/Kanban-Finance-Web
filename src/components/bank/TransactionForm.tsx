"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft, FaTag, FaIndianRupeeSign, FaAlignLeft, FaChevronDown,
} from "react-icons/fa6";
import { TextField } from "@/components/common/TextField";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/authContext";
import { Validators } from "@/lib/validators";
import {
  ALL_TXN_STATUSES, ALL_TXN_TYPES,
  TransactionStatusMeta, TransactionTypeMeta,
  type TransactionModel, type TransactionStatus, type TransactionType,
} from "@/lib/models";
import { createTransaction, updateTransaction } from "@/lib/firestoreService";

interface Props {
  bankAccountId: string;
  existing?: TransactionModel;
}

export function TransactionForm({ bankAccountId, existing }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const isEditing = !!existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [type, setType] = useState<TransactionType>(existing?.type ?? "credit");
  const [status, setStatus] = useState<TransactionStatus>(existing?.status ?? "completed");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next = {
      title: Validators.required(title, "Title"),
      amount: Validators.amount(amount),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing && existing) {
        await updateTransaction({
          ...existing,
          title: title.trim(),
          amount: parseFloat(amount),
          type, status,
          description: description.trim(),
        });
        toast.show("Transaction updated ✅", "success");
      } else {
        await createTransaction({
          bankAccountId,
          userId: user.uid,
          title: title.trim(),
          amount: parseFloat(amount),
          type, status,
          description: description.trim(),
        });
        toast.show("Transaction added 🎉", "success");
      }
      router.back();
    } catch (err: any) {
      toast.show(err?.message ?? "Save failed", "error");
    } finally {
      setLoading(false);
    }
  }

  const isCredit = type === "credit";
  const previewAmount = parseFloat(amount);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-dark-border bg-dark-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-text-primary hover:bg-dark-card focus-ring">
            <FaArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold text-text-primary">
            {isEditing ? "Edit Transaction ✏️" : "Add Transaction 💸"}
          </h1>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        <TextField
          label="Transaction Title 📝"
          hint="e.g., Salary, Rent, Grocery"
          prefix={<FaTag size={14} />}
          value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title}
        />

        <TextField
          label="Amount 💰" hint="Enter amount" type="number" inputMode="decimal" step="0.01"
          prefix={<FaIndianRupeeSign size={14} />}
          value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount}
        />

        <SelectField label="Transaction Type" value={type} onChange={(v) => setType(v as TransactionType)}>
          {ALL_TXN_TYPES.map((t) => (
            <option key={t} value={t}>{TransactionTypeMeta[t].emoji}  {TransactionTypeMeta[t].label}</option>
          ))}
        </SelectField>

        <SelectField label="Status" value={status} onChange={(v) => setStatus(v as TransactionStatus)}>
          {ALL_TXN_STATUSES.map((s) => (
            <option key={s} value={s}>{TransactionStatusMeta[s].emoji}  {TransactionStatusMeta[s].label}</option>
          ))}
        </SelectField>

        <TextField
          label="Description (Optional) 📝" hint="Add a note..." multiline
          prefix={<FaAlignLeft size={14} />}
          value={description}
          onChange={(e) => setDescription((e.target as unknown as HTMLTextAreaElement).value)}
        />

        {!Number.isNaN(previewAmount) && previewAmount > 0 && (
          <div className={`flex items-center gap-3 rounded-2xl border p-4 animate-fade-in ${
            isCredit
              ? "border-accent-green/30 bg-light-green"
              : "border-accent-amber/30 bg-light-amber"
          }`}>
            <span className="text-3xl">{isCredit ? "📥" : "📤"}</span>
            <div className="flex-1">
              <p className="text-[11px] text-text-hint">Preview</p>
              <p className={`text-2xl font-extrabold ${isCredit ? "text-accent-green" : "text-accent-amber"}`}>
                {isCredit ? "+" : "−"} ₹{amount}
              </p>
            </div>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-dark-bg">
              {TransactionStatusMeta[status].emoji} {TransactionStatusMeta[status].label}
            </span>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <span className="spinner" /> : (isEditing ? "Update Transaction ✅" : "Add Transaction 💸")}
        </button>
      </form>
    </div>
  );
}

function SelectField({
  label, value, onChange, children,
}: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-text-secondary">{label}</p>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="input-base appearance-none pr-10">
          {children}
        </select>
        <FaChevronDown size={11} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-hint" />
      </div>
    </div>
  );
}

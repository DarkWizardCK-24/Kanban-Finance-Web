"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa6";
import { useAuth } from "@/lib/authContext";
import { watchBankAccounts, deleteBankAccount } from "@/lib/firestoreService";
import { type BankAccountModel } from "@/lib/models";
import { BankCard } from "@/components/bank/BankCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Loading } from "@/components/common/Loading";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";

export default function AccountsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [accounts, setAccounts] = useState<BankAccountModel[] | null>(null);
  const [confirm, setConfirm] = useState<BankAccountModel | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = watchBankAccounts(user.uid, setAccounts);
    return unsub;
  }, [user]);

  if (!user) return null;
  if (accounts === null) return <Loading message="Loading accounts..." />;

  if (accounts.length === 0) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          emoji="🏦"
          title="No Bank Accounts"
          subtitle="Tap the button below to add your first bank account!"
          actionLabel="Add Bank Account"
          onAction={() => router.push("/accounts/new")}
        />
      </div>
    );
  }

  async function onConfirmDelete() {
    if (!confirm) return;
    try {
      await deleteBankAccount(confirm.id);
      toast.show(`Deleted ${confirm.bankName}`, "success");
    } catch (e: any) {
      toast.show(e?.message ?? "Delete failed", "error");
    }
    setConfirm(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Bank Accounts</h1>
        <Link href="/accounts/new" className="btn-primary px-4 py-2.5 text-sm">
          <FaPlus size={13} /> Add Account
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a, i) => (
          <BankCard
            key={a.id}
            account={a}
            index={i}
            onClick={() => router.push(`/accounts/${a.id}`)}
            onEdit={() => router.push(`/accounts/${a.id}/edit`)}
            onDelete={() => setConfirm(a)}
          />
        ))}
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)}
        title={`Delete ${confirm?.bankName}?`}
        footer={
          <>
            <button onClick={() => setConfirm(null)} className="btn-outline">Cancel</button>
            <button onClick={onConfirmDelete} className="btn-danger">Delete</button>
          </>
        }>
        This will permanently delete this account and all its transactions.
      </Modal>
    </div>
  );
}

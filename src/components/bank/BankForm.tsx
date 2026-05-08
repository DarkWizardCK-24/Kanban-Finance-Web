"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaArrowLeft, FaBuildingColumns, FaCode, FaCreditCard, FaShieldHalved,
  FaCalendarCheck, FaHashtag, FaBookOpen, FaChevronDown,
} from "react-icons/fa6";
import { TextField } from "@/components/common/TextField";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/authContext";
import { Validators } from "@/lib/validators";
import {
  ALL_CATEGORIES, AccountCategoryMeta,
  type AccountCategory, type BankAccountModel,
} from "@/lib/models";
import { createBankAccount, updateBankAccount } from "@/lib/firestoreService";

interface Props {
  existing?: BankAccountModel;
}

export function BankForm({ existing }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [bankName, setBankName] = useState(existing?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber ?? "");
  const [ifsc, setIfsc] = useState(existing?.ifscCode ?? "");
  const [cardNumber, setCardNumber] = useState(existing?.cardNumber ?? "");
  const [cvv, setCvv] = useState(existing?.cvv ?? "");
  const [validity, setValidity] = useState(
    existing?.cardValidity ? toMonthInput(existing.cardValidity) : "",
  );
  const [category, setCategory] = useState<AccountCategory>(existing?.category ?? "savings");
  const [hasCard, setHasCard] = useState<boolean>(existing?.hasCard ?? true);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);

  const isEditing = !!existing;
  const isPostal = category === "postalSavings";

  useEffect(() => { if (isPostal) setHasCard(false); }, [isPostal]);

  function validate(): boolean {
    const next: Record<string, string | null> = {
      bankName: Validators.required(bankName, "Bank name"),
      accountNumber: Validators.accountNumber(accountNumber),
      ifsc: isPostal ? null : Validators.ifscCode(ifsc),
    };
    if (!isPostal && hasCard) {
      next.cardNumber = Validators.cardNumber(cardNumber);
      next.cvv = Validators.cvv(cvv);
      next.validity = validity ? null : "Select validity";
    }
    setErrors(next);
    return !Object.values(next).some(Boolean);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const cardValidity = !isPostal && hasCard && validity ? fromMonthInput(validity) : null;
      const payload = {
        bankName: bankName.trim(),
        category,
        accountNumber: accountNumber.trim(),
        ifscCode: isPostal ? "" : ifsc.trim().toUpperCase(),
        cardNumber: !isPostal && hasCard ? cardNumber.trim() : "",
        cvv: !isPostal && hasCard ? cvv.trim() : "",
        cardValidity,
        hasCard: !isPostal && hasCard,
      };
      if (isEditing && existing) {
        await updateBankAccount({
          ...existing,
          ...payload,
          updatedAt: new Date(),
        });
        toast.show("Bank account updated ✅", "success");
      } else {
        await createBankAccount({ userId: user.uid, ...payload });
        toast.show("Bank account added 🎉", "success");
      }
      router.back();
    } catch (e: any) {
      toast.show(e?.message ?? "Save failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-dark-border bg-dark-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-text-primary hover:bg-dark-card focus-ring">
            <FaArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold text-text-primary">
            {isEditing ? "Edit Bank Account" : "Add Bank Account"}
          </h1>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
        <SectionHeader icon={<FaBuildingColumns size={11} />} label="Account Information" />

        <div>
          <p className="mb-1.5 text-xs font-semibold text-text-secondary">Category</p>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AccountCategory)}
              className="input-base appearance-none pr-10"
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {AccountCategoryMeta[c].emoji} &nbsp; {AccountCategoryMeta[c].label}
                </option>
              ))}
            </select>
            <FaChevronDown size={11} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-hint" />
          </div>
        </div>

        <TextField
          label="Bank / Institution Name"
          hint="e.g., State Bank of India, India Post"
          prefix={<FaBuildingColumns size={14} />}
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          error={errors.bankName}
        />
        <TextField
          label="Account Number"
          hint="Enter account number (6–18 digits)"
          inputMode="numeric"
          maxLength={18}
          prefix={<FaHashtag size={14} />}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          error={errors.accountNumber}
        />
        {!isPostal && (
          <TextField
            label="IFSC Code"
            hint="e.g., SBIN0001234"
            maxLength={11}
            prefix={<FaCode size={14} />}
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
            error={errors.ifsc}
          />
        )}

        {!isPostal && (
          <>
            <SectionHeader icon={<FaCreditCard size={11} />} label="Card Credentials" />

            <button type="button" onClick={() => setHasCard((v) => !v)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                hasCard ? "border-accent-cyan/40 bg-dark-card" : "border-dark-border bg-dark-card"
              }`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                hasCard ? "bg-accent-cyan/15 text-accent-cyan" : "bg-accent-gold/15 text-accent-gold"
              }`}>
                {hasCard ? <FaCreditCard size={13} /> : <FaBookOpen size={13} />}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {hasCard ? "Has Debit/Credit Card" : "Account / Passbook Only"}
                </p>
                <p className="text-[11px] text-text-secondary">
                  {hasCard ? "Card number, CVV & expiry required" : "No card — e.g. Post Office, Postal Savings"}
                </p>
              </div>
              <span className={`relative h-6 w-11 rounded-full transition-colors ${
                hasCard ? "bg-accent-cyan/40" : "bg-dark-border"
              }`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  hasCard ? "left-0.5 translate-x-5 !bg-accent-cyan" : "left-0.5"
                }`} />
              </span>
            </button>

            {hasCard && (
              <>
                <TextField
                  label="Card Number" hint="16-digit card number"
                  inputMode="numeric" maxLength={16}
                  prefix={<FaCreditCard size={14} />}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                  error={errors.cardNumber}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="CVV" hint="•••" type="password"
                    inputMode="numeric" maxLength={3}
                    prefix={<FaShieldHalved size={14} />}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                    error={errors.cvv}
                  />
                  <TextField
                    label="Valid Thru" hint="MM/YY" type="month"
                    prefix={<FaCalendarCheck size={14} />}
                    value={validity} onChange={(e) => setValidity(e.target.value)}
                    error={errors.validity}
                  />
                </div>
              </>
            )}
          </>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <span className="spinner" /> : (isEditing ? "Update Account" : "Add Account")}
        </button>
      </form>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-cyan/12 text-accent-cyan">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{label}</span>
    </div>
  );
}

function toMonthInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function fromMonthInput(s: string): Date {
  const [y, m] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1);
}

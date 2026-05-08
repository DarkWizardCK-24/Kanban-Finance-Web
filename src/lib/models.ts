import { Timestamp } from "firebase/firestore";

// ── User ─────────────────────────────────────────────────────────────────────
export interface UserModel {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

export function calculateAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
  ) age--;
  return age;
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.length > 0 ? name[0].toUpperCase() : "?";
}

export function userFromMap(map: Record<string, any>): UserModel {
  const dob = (map.dateOfBirth as Timestamp).toDate();
  return {
    id: map.id ?? "",
    uid: map.uid ?? "",
    name: map.name ?? "",
    email: map.email ?? "",
    phone: map.phone ?? "",
    dateOfBirth: dob,
    age: calculateAge(dob),
    createdAt: (map.createdAt as Timestamp | undefined)?.toDate() ?? new Date(),
    updatedAt: (map.updatedAt as Timestamp | undefined)?.toDate() ?? new Date(),
  };
}

export function userToMap(u: UserModel): Record<string, any> {
  return {
    id: u.id,
    uid: u.uid,
    name: u.name,
    email: u.email,
    phone: u.phone,
    dateOfBirth: Timestamp.fromDate(u.dateOfBirth),
    age: u.age,
    createdAt: Timestamp.fromDate(u.createdAt),
    updatedAt: Timestamp.fromDate(u.updatedAt),
  };
}

// ── Account Category ─────────────────────────────────────────────────────────
export type AccountCategory =
  | "savings" | "expenses" | "fixed" | "current"
  | "salary"  | "recurring"| "nri"   | "business" | "postalSavings";

export const AccountCategoryMeta: Record<AccountCategory, { label: string; emoji: string }> = {
  savings:        { label: "Savings",          emoji: "💰" },
  expenses:       { label: "Expenses",         emoji: "💳" },
  fixed:          { label: "Fixed Deposit",    emoji: "🏦" },
  current:        { label: "Current",          emoji: "🔄" },
  salary:         { label: "Salary",           emoji: "💵" },
  recurring:      { label: "Recurring Deposit",emoji: "📅" },
  nri:            { label: "NRI",              emoji: "🌍" },
  business:       { label: "Business",         emoji: "🏢" },
  postalSavings:  { label: "Postal Savings",   emoji: "📮" },
};

export const ALL_CATEGORIES: AccountCategory[] = [
  "savings", "expenses", "fixed", "current", "salary",
  "recurring", "nri", "business", "postalSavings",
];

// ── Bank Account ─────────────────────────────────────────────────────────────
export interface BankAccountModel {
  id: string;
  userId: string;
  bankName: string;
  category: AccountCategory;
  accountNumber: string;
  ifscCode: string;
  cardNumber: string;
  cvv: string;
  cardValidity: Date | null;
  hasCard: boolean;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function maskAccountNumber(n: string): string {
  if (n.length < 4) return n;
  return `****${n.slice(-4)}`;
}

export function maskCardNumber(account: BankAccountModel): string {
  if (!account.hasCard || account.cardNumber.length < 4) return "•••• •••• •••• ••••";
  return `**** **** **** ${account.cardNumber.slice(-4)}`;
}

export function bankAccountFromMap(map: Record<string, any>): BankAccountModel {
  const validKeys = new Set<AccountCategory>(ALL_CATEGORIES);
  const cat = (validKeys.has(map.category) ? map.category : "savings") as AccountCategory;
  return {
    id: map.id ?? "",
    userId: map.userId ?? "",
    bankName: map.bankName ?? "",
    category: cat,
    accountNumber: map.accountNumber ?? "",
    ifscCode: map.ifscCode ?? "",
    cardNumber: map.cardNumber ?? "",
    cvv: map.cvv ?? "",
    cardValidity: (map.cardValidity as Timestamp | null | undefined)?.toDate() ?? null,
    hasCard: typeof map.hasCard === "boolean"
      ? map.hasCard
      : !!(map.cardNumber && (map.cardNumber as string).length > 0),
    totalAmount: Number(map.totalAmount ?? 0),
    createdAt: (map.createdAt as Timestamp | undefined)?.toDate() ?? new Date(),
    updatedAt: (map.updatedAt as Timestamp | undefined)?.toDate() ?? new Date(),
  };
}

export function bankAccountToMap(a: BankAccountModel): Record<string, any> {
  return {
    id: a.id,
    userId: a.userId,
    bankName: a.bankName,
    category: a.category,
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    cardNumber: a.cardNumber,
    cvv: a.cvv,
    cardValidity: a.cardValidity ? Timestamp.fromDate(a.cardValidity) : null,
    hasCard: a.hasCard,
    totalAmount: a.totalAmount,
    createdAt: Timestamp.fromDate(a.createdAt),
    updatedAt: Timestamp.fromDate(a.updatedAt),
  };
}

// ── Transaction ──────────────────────────────────────────────────────────────
export type TransactionStatus = "pending" | "completed" | "failed" | "processing" | "cancelled";
export type TransactionType = "credit" | "debit";

export const TransactionStatusMeta: Record<TransactionStatus, { label: string; emoji: string }> = {
  pending:    { label: "Pending",    emoji: "⏳" },
  completed:  { label: "Completed",  emoji: "✅" },
  failed:     { label: "Failed",     emoji: "❌" },
  processing: { label: "Processing", emoji: "🔄" },
  cancelled:  { label: "Cancelled",  emoji: "🚫" },
};

export const TransactionTypeMeta: Record<TransactionType, { label: string; emoji: string }> = {
  credit: { label: "Credit", emoji: "📥" },
  debit:  { label: "Debit",  emoji: "📤" },
};

export const ALL_TXN_STATUSES: TransactionStatus[] = ["pending", "completed", "failed", "processing", "cancelled"];
export const ALL_TXN_TYPES: TransactionType[] = ["credit", "debit"];

export interface TransactionModel {
  id: string;
  bankAccountId: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  timestamp: Date;
  createdAt: Date;
}

export function effectiveAmount(t: TransactionModel): number {
  if (t.status === "failed" || t.status === "cancelled") return 0;
  return t.type === "credit" ? t.amount : -t.amount;
}

export function transactionFromMap(map: Record<string, any>): TransactionModel {
  const statuses = new Set<TransactionStatus>(ALL_TXN_STATUSES);
  const types = new Set<TransactionType>(ALL_TXN_TYPES);
  return {
    id: map.id ?? "",
    bankAccountId: map.bankAccountId ?? "",
    userId: map.userId ?? "",
    title: map.title ?? "",
    amount: Number(map.amount ?? 0),
    type: (types.has(map.type) ? map.type : "credit") as TransactionType,
    status: (statuses.has(map.status) ? map.status : "pending") as TransactionStatus,
    description: map.description ?? "",
    timestamp: (map.timestamp as Timestamp | undefined)?.toDate() ?? new Date(),
    createdAt: (map.createdAt as Timestamp | undefined)?.toDate() ?? new Date(),
  };
}

export function transactionToMap(t: TransactionModel): Record<string, any> {
  return {
    id: t.id,
    bankAccountId: t.bankAccountId,
    userId: t.userId,
    title: t.title,
    amount: t.amount,
    type: t.type,
    status: t.status,
    description: t.description,
    timestamp: Timestamp.fromDate(t.timestamp),
    createdAt: Timestamp.fromDate(t.createdAt),
  };
}

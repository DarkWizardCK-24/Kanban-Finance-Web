import {
  collection, deleteDoc, doc, getDocs, onSnapshot, query,
  setDoc, updateDoc, where, writeBatch, Timestamp,
} from "firebase/firestore";
import { firestore } from "./firebase";
import { IdGenerator } from "./idGenerator";
import {
  bankAccountFromMap, bankAccountToMap,
  transactionFromMap, transactionToMap,
  type BankAccountModel, type TransactionModel,
  type AccountCategory, type TransactionStatus, type TransactionType,
} from "./models";
import { calculateAccountTotal, calculateWealth, type WealthSummary } from "./wealth";

// ── BANK ACCOUNTS ────────────────────────────────────────────────────────────
export function watchBankAccounts(
  userId: string,
  callback: (accounts: BankAccountModel[]) => void,
  errorCallback?: (e: Error) => void,
): () => void {
  const q = query(collection(firestore, "bank_accounts"), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => bankAccountFromMap(d.data()));
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(list);
    },
    (err) => errorCallback?.(err as Error),
  );
}

export async function createBankAccount(input: {
  userId: string;
  bankName: string;
  category: AccountCategory;
  accountNumber: string;
  ifscCode: string;
  cardNumber?: string;
  cvv?: string;
  cardValidity?: Date | null;
  hasCard?: boolean;
}): Promise<BankAccountModel> {
  const id = await IdGenerator.bank();
  const now = new Date();
  const account: BankAccountModel = {
    id,
    userId: input.userId,
    bankName: input.bankName,
    category: input.category,
    accountNumber: input.accountNumber,
    ifscCode: input.ifscCode,
    cardNumber: input.cardNumber ?? "",
    cvv: input.cvv ?? "",
    cardValidity: input.cardValidity ?? null,
    hasCard: input.hasCard ?? true,
    totalAmount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(firestore, "bank_accounts", id), bankAccountToMap(account));
  return account;
}

export async function updateBankAccount(account: BankAccountModel): Promise<void> {
  await updateDoc(doc(firestore, "bank_accounts", account.id), bankAccountToMap(account));
}

export async function deleteBankAccount(bankId: string): Promise<void> {
  const txns = await getDocs(
    query(collection(firestore, "transactions"), where("bankAccountId", "==", bankId)),
  );
  const batch = writeBatch(firestore);
  txns.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(firestore, "bank_accounts", bankId));
  await batch.commit();
}

// ── TRANSACTIONS ─────────────────────────────────────────────────────────────
export function watchTransactionsForBank(
  bankAccountId: string,
  callback: (txns: TransactionModel[]) => void,
): () => void {
  const q = query(collection(firestore, "transactions"), where("bankAccountId", "==", bankAccountId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => transactionFromMap(d.data()));
    list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    callback(list);
  });
}

export function watchAllTransactions(
  userId: string,
  callback: (txns: TransactionModel[]) => void,
): () => void {
  const q = query(collection(firestore, "transactions"), where("userId", "==", userId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => transactionFromMap(d.data()));
    list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    callback(list);
  });
}

export async function createTransaction(input: {
  bankAccountId: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
}): Promise<TransactionModel> {
  const id = await IdGenerator.transaction();
  const now = new Date();
  const txn: TransactionModel = {
    id,
    bankAccountId: input.bankAccountId,
    userId: input.userId,
    title: input.title,
    amount: input.amount,
    type: input.type,
    status: input.status,
    description: input.description ?? "",
    timestamp: now,
    createdAt: now,
  };
  await setDoc(doc(firestore, "transactions", id), transactionToMap(txn));
  await updateBankAccountTotal(input.bankAccountId);
  return txn;
}

export async function updateTransaction(txn: TransactionModel): Promise<void> {
  await updateDoc(doc(firestore, "transactions", txn.id), transactionToMap(txn));
  await updateBankAccountTotal(txn.bankAccountId);
}

export async function deleteTransaction(txn: TransactionModel): Promise<void> {
  await deleteDoc(doc(firestore, "transactions", txn.id));
  await updateBankAccountTotal(txn.bankAccountId);
}

export async function moveTransactionToAccount(
  txn: TransactionModel, newBankAccountId: string,
): Promise<void> {
  const oldId = txn.bankAccountId;
  await updateDoc(doc(firestore, "transactions", txn.id), {
    bankAccountId: newBankAccountId,
  });
  await updateBankAccountTotal(oldId);
  await updateBankAccountTotal(newBankAccountId);
}

async function updateBankAccountTotal(bankAccountId: string): Promise<void> {
  const snap = await getDocs(
    query(collection(firestore, "transactions"), where("bankAccountId", "==", bankAccountId)),
  );
  const txns = snap.docs.map((d) => transactionFromMap(d.data()));
  const total = calculateAccountTotal(txns);
  await updateDoc(doc(firestore, "bank_accounts", bankAccountId), {
    totalAmount: total,
    updatedAt: Timestamp.now(),
  });
}

// ── WEALTH ───────────────────────────────────────────────────────────────────
export async function getWealthSummary(userId: string): Promise<WealthSummary> {
  const accountsSnap = await getDocs(
    query(collection(firestore, "bank_accounts"), where("userId", "==", userId)),
  );
  const accounts = accountsSnap.docs.map((d) => bankAccountFromMap(d.data()));
  const txnSnap = await getDocs(
    query(collection(firestore, "transactions"), where("userId", "==", userId)),
  );
  const transactions = txnSnap.docs.map((d) => transactionFromMap(d.data()));
  return calculateWealth(accounts, transactions);
}

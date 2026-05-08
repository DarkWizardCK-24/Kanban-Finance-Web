import { BankAccountModel, TransactionModel, effectiveAmount } from "./models";

export interface WealthSummary {
  totalWealth: number;
  totalSavings: number;
  totalExpenses: number;
  totalFixed: number;
  totalCurrent: number;
  totalSalary: number;
  totalRecurring: number;
  totalNri: number;
  totalBusiness: number;
  totalAccounts: number;
  totalTransactions: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  netMonthlyFlow: number;
}

export function calculateAccountTotal(transactions: TransactionModel[]): number {
  let total = 0;
  for (const t of transactions) total += effectiveAmount(t);
  return total;
}

export function calculateWealth(
  accounts: BankAccountModel[],
  transactions: TransactionModel[],
): WealthSummary {
  let totalWealth = 0;
  let totalSavings = 0, totalExpenses = 0, totalFixed = 0, totalCurrent = 0;
  let totalSalary = 0, totalRecurring = 0, totalNri = 0, totalBusiness = 0;
  let monthlyInflow = 0, monthlyOutflow = 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  for (const account of accounts) {
    const accountTxns = transactions.filter((t) => t.bankAccountId === account.id);
    let accountTotal = 0;
    for (const txn of accountTxns) {
      accountTotal += effectiveAmount(txn);
      if (txn.timestamp.getTime() > monthStart.getTime()) {
        if (txn.type === "credit" && txn.status === "completed") monthlyInflow += txn.amount;
        else if (txn.type === "debit" && txn.status === "completed") monthlyOutflow += txn.amount;
      }
    }

    switch (account.category) {
      case "savings":        totalSavings   += accountTotal; totalWealth += accountTotal; break;
      case "expenses":       totalExpenses  += accountTotal; totalWealth += accountTotal; break;
      case "fixed":          totalFixed     += accountTotal; totalWealth += accountTotal; break;
      case "current":        totalCurrent   += accountTotal; totalWealth += accountTotal; break;
      case "salary":         totalSalary    += accountTotal; totalWealth += accountTotal; break;
      case "recurring":      totalRecurring += accountTotal; totalWealth += accountTotal; break;
      case "nri":            totalNri       += accountTotal; totalWealth += accountTotal; break;
      case "business":       totalBusiness  += accountTotal; totalWealth += accountTotal; break;
      case "postalSavings":  totalSavings   += accountTotal; totalWealth += accountTotal; break;
    }
  }

  return {
    totalWealth, totalSavings, totalExpenses, totalFixed, totalCurrent,
    totalSalary, totalRecurring, totalNri, totalBusiness,
    totalAccounts: accounts.length,
    totalTransactions: transactions.length,
    monthlyInflow, monthlyOutflow,
    netMonthlyFlow: monthlyInflow - monthlyOutflow,
  };
}

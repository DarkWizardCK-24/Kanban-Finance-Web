"use client";

import { FaPenToSquare, FaTrash, FaClock } from "react-icons/fa6";
import {
  type TransactionModel, TransactionStatusMeta, TransactionTypeMeta,
} from "@/lib/models";
import { Formatters } from "@/lib/formatters";
import { AppColors } from "@/lib/colors";

interface Props {
  txn: TransactionModel;
  onEdit?: () => void;
  onDelete?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
  index?: number;
  isDragging?: boolean;
}

function statusColor(status: TransactionModel["status"]): string {
  switch (status) {
    case "pending":    return AppColors.accentAmber;
    case "processing": return AppColors.primaryBlue;
    case "completed":  return AppColors.accentGreen;
    case "failed":     return AppColors.accentRed;
    case "cancelled":  return AppColors.textHint;
  }
}

export function TransactionCard({
  txn, onEdit, onDelete, onDragStart, onDragEnd, draggable = true, index = 0, isDragging,
}: Props) {
  const isCredit = txn.type === "credit";
  const sColor = statusColor(txn.status);

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ animationDelay: `${index * 35}ms` }}
      className={`mb-2 rounded-xl border bg-dark-card p-2.5 transition-all animate-fade-in ${
        isDragging
          ? "scale-[1.02] border-accent-cyan shadow-[0_8px_24px_rgba(79,195,247,0.3)]"
          : "border-dark-border hover:border-accent-cyan/40"
      } ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate text-[12px] font-semibold text-text-primary">{txn.title}</p>
        {onEdit && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-text-hint hover:text-accent-cyan focus-ring" aria-label="Edit">
            <FaPenToSquare size={11} />
          </button>
        )}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-accent-red/80 hover:text-accent-red focus-ring" aria-label="Delete">
            <FaTrash size={11} />
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${
          isCredit ? "bg-light-green text-accent-green" : "bg-light-amber text-accent-amber"
        }`}>
          <span>{TransactionTypeMeta[txn.type].emoji}</span>
          <span>{isCredit ? "+" : "−"}{Formatters.compactCurrency(txn.amount)}</span>
        </span>
        <span className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold"
          style={{ color: sColor, backgroundColor: `${sColor}26` }}>
          <span>{TransactionStatusMeta[txn.status].emoji}</span>
          {TransactionStatusMeta[txn.status].label}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-text-hint">
        <FaClock size={9} />
        <span className="truncate">{Formatters.dateTimeIST(txn.timestamp)}</span>
      </div>

      {txn.description && (
        <p className="mt-1 line-clamp-1 text-[11px] text-text-secondary">{txn.description}</p>
      )}
    </div>
  );
}

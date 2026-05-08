"use client";

import { FaBuildingColumns, FaLock, FaWifi, FaArrowRight, FaEllipsisVertical, FaPenToSquare, FaTrash, FaHashtag } from "react-icons/fa6";
import { useState } from "react";
import {
  AccountCategoryMeta, type BankAccountModel,
  maskCardNumber, maskAccountNumber,
} from "@/lib/models";
import { Formatters } from "@/lib/formatters";
import { bankGradientFor, CategoryGradients } from "@/lib/colors";

interface Props {
  account: BankAccountModel;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index?: number;
}

function gradientFor(account: BankAccountModel) {
  return bankGradientFor(account.bankName) ?? CategoryGradients[account.category];
}

export function BankCard({ account, onClick, onEdit, onDelete, index = 0 }: Props) {
  const [from, to] = gradientFor(account);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        boxShadow: `0 14px 28px ${from}88`,
        animationDelay: `${index * 70}ms`,
      }}
      className="group relative h-[260px] cursor-pointer overflow-hidden rounded-2xl text-white transition-transform hover:-translate-y-0.5 animate-fade-in"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.(); }}
    >
      {/* Decorative circles */}
      <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
      <span className="pointer-events-none absolute -bottom-7 right-7 h-24 w-24 rounded-full bg-white/[0.06]" />
      <span className="pointer-events-none absolute -left-5 bottom-3 h-16 w-16 rounded-full bg-white/[0.04]" />

      <div className="relative flex h-full flex-col justify-between p-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-md bg-white/20 p-1.5 text-white"><FaBuildingColumns size={13} /></span>
            <h3 className="flex-1 truncate text-base font-extrabold tracking-wide">{account.bankName}</h3>
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
                  className="rounded-md p-1 text-white/80 hover:bg-white/10 focus-ring"
                  aria-label="Card options"
                >
                  <FaEllipsisVertical size={14} />
                </button>
                {menuOpen && (
                  <>
                    <span className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                    <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-dark-border bg-dark-card text-text-primary shadow-card animate-scale-in">
                      {onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs hover:bg-dark-card-alt">
                          <FaPenToSquare size={11} className="text-accent-cyan" /> Edit Account
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs text-accent-red hover:bg-dark-card-alt">
                          <FaTrash size={11} /> Delete Account
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
              {AccountCategoryMeta[account.category].emoji} {AccountCategoryMeta[account.category].label}
            </span>
            {!account.hasCard && (
              <span className="rounded-md border border-accent-gold/40 bg-accent-gold/20 px-2 py-0.5 text-[11px] font-semibold text-accent-gold">
                📖 Account Only
              </span>
            )}
          </div>

          <div className="mt-4">
            {account.hasCard ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="block h-7 w-10 rounded-md bg-gradient-to-br from-[#FFD700] to-[#B8860B] shadow-inner" />
                  <FaWifi className="text-white/45" size={16} />
                </div>
                <p className="mt-2.5 truncate font-mono text-base font-semibold tracking-[0.3em] text-white/95">
                  {maskCardNumber(account)}
                </p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <FaHashtag size={10} className="text-white/50" />
                  <p className="truncate font-mono text-sm font-semibold tracking-[0.2em] text-white">
                    ACCT: {maskAccountNumber(account.accountNumber)}
                  </p>
                </div>
                {account.ifscCode && (
                  <div className="flex items-center gap-1.5">
                    <FaBuildingColumns size={9} className="text-white/40" />
                    <p className="truncate font-mono text-[11px] tracking-wider text-white/75">
                      IFSC: {account.ifscCode}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div>
          <div className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold tracking-[0.12em] text-white/55">BALANCE</p>
              <p className="mt-0.5 truncate text-xl font-extrabold leading-none">
                {Formatters.compactCurrency(account.totalAmount)}
              </p>
            </div>
            {account.hasCard && account.cardValidity && (
              <div>
                <p className="text-[9px] font-bold tracking-[0.12em] text-white/55">VALID THRU</p>
                <p className="mt-0.5 text-sm font-bold">{Formatters.monthYear(account.cardValidity)}</p>
              </div>
            )}
          </div>

          <div className="mt-3 h-px bg-white/20" />
          <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-white/60">
            <FaLock size={9} />
            <span className="flex-1 truncate">
              {account.hasCard ? "Tap to view credentials & transactions" : "Tap to view account details & transactions"}
            </span>
            <FaArrowRight size={9} className="text-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

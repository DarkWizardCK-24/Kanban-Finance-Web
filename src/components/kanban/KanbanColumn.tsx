"use client";

import { useState, type ReactNode } from "react";
import { type TransactionModel } from "@/lib/models";

interface Props {
  title: string;
  emoji: string;
  headerColor: string;
  background: string;
  count: number;
  onDrop?: (txnId: string) => void;
  acceptDrop?: boolean;
  children?: ReactNode;
  width?: number;
  emptyMessage?: string;
}

export function KanbanColumn({
  title, emoji, headerColor, background, count,
  onDrop, acceptDrop = true, children, width = 300, emptyMessage,
}: Props) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (!acceptDrop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!hovering) setHovering(true);
      }}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHovering(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onDrop?.(id);
      }}
      style={{
        width,
        background: hovering ? `${headerColor}1A` : background,
        borderColor: hovering ? headerColor : "#253450",
        borderWidth: hovering ? 1.5 : 1,
        boxShadow: hovering ? `0 8px 22px ${headerColor}33` : undefined,
      }}
      className="mr-3 flex shrink-0 flex-col self-stretch rounded-2xl border transition-colors"
    >
      <div className="rounded-t-2xl border-b px-3.5 py-3"
        style={{ borderColor: `${headerColor}33`, backgroundColor: `${headerColor}1F` }}>
        <div className="flex items-center gap-2">
          <span className="text-[17px]">{emoji}</span>
          <h3 className="flex-1 truncate text-sm font-bold" style={{ color: headerColor }}>{title}</h3>
          <span className="rounded-md px-2 py-0.5 text-[11px] font-bold"
            style={{ color: headerColor, backgroundColor: `${headerColor}33` }}>
            {count}
          </span>
        </div>
      </div>

      {hovering && (
        <div className="py-1.5 text-center text-[11px] font-semibold"
          style={{ color: headerColor }}>
          ⬇ Drop to move to {title}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2.5 themed-scroll">
        {count === 0 ? (
          <div className="flex h-full min-h-[120px] items-center justify-center px-3 text-center">
            <p className={`text-xs ${hovering ? "font-semibold" : "font-normal"}`}
              style={{ color: hovering ? headerColor : "#4A5B7A" }}>
              {hovering ? "Drop here!" : (emptyMessage ?? "No transactions")}
            </p>
          </div>
        ) : children}
      </div>
    </div>
  );
}

// Filter helpers re-used between two kanban screens
export function txnsByStatus(txns: TransactionModel[]) {
  return {
    pending:    txns.filter((t) => t.status === "pending"),
    processing: txns.filter((t) => t.status === "processing"),
    completed:  txns.filter((t) => t.status === "completed"),
    failed:     txns.filter((t) => t.status === "failed" || t.status === "cancelled"),
  };
}

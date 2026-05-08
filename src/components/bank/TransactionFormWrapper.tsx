"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { type TransactionModel, transactionFromMap } from "@/lib/models";
import { Loading } from "@/components/common/Loading";
import { TransactionForm } from "./TransactionForm";

export function TransactionFormWrapper({ editing = false }: { editing?: boolean }) {
  const params = useParams<{ id: string; txnId?: string }>();
  const [existing, setExisting] = useState<TransactionModel | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!editing || !params?.txnId) { setLoaded(true); return; }
    getDoc(doc(firestore, "transactions", params.txnId)).then((snap) => {
      if (snap.exists()) setExisting(transactionFromMap(snap.data()));
      setLoaded(true);
    });
  }, [editing, params?.txnId]);

  if (!loaded) return <Loading message="Loading transaction..." />;
  if (!params?.id) return null;
  return <TransactionForm bankAccountId={params.id} existing={existing ?? undefined} />;
}

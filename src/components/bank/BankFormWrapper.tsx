"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { type BankAccountModel, bankAccountFromMap } from "@/lib/models";
import { Loading } from "@/components/common/Loading";
import { BankForm } from "./BankForm";

export function BankFormWrapper() {
  const params = useParams<{ id: string }>();
  const [account, setAccount] = useState<BankAccountModel | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    getDoc(doc(firestore, "bank_accounts", params.id)).then((snap) => {
      if (snap.exists()) setAccount(bankAccountFromMap(snap.data()));
      setLoaded(true);
    });
  }, [params?.id]);

  if (!loaded) return <Loading message="Loading account..." />;
  return <BankForm existing={account ?? undefined} />;
}

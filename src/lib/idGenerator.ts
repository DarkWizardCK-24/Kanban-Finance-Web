import {
  collection, getDocs, limit, orderBy, query,
} from "firebase/firestore";
import { firestore } from "./firebase";

async function nextId(coll: string, prefix: string, pad: number): Promise<string> {
  const snap = await getDocs(
    query(collection(firestore, coll), orderBy("createdAt", "desc"), limit(1)),
  );
  if (snap.empty) return `${prefix}${"1".padStart(pad, "0")}`;
  const last = snap.docs[0].data().id as string | undefined;
  if (!last) return `${prefix}${"1".padStart(pad, "0")}`;
  const num = parseInt(last.replace(prefix, ""), 10) || 0;
  return `${prefix}${String(num + 1).padStart(pad, "0")}`;
}

export const IdGenerator = {
  user: () => nextId("users", "USER", 4),
  bank: () => nextId("bank_accounts", "BANK", 4),
  transaction: () => nextId("transactions", "TXN", 4),
};

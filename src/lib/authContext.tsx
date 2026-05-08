"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import { firebaseAuth, firestore } from "./firebase";
import { type UserModel, userFromMap } from "./models";

interface AuthCtx {
  firebaseUser: User | null;
  user: UserModel | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  firebaseUser: null,
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (u: User | null) => {
    if (!u) { setUser(null); return; }
    try {
      const snap = await getDoc(doc(firestore, "users", u.uid));
      setUser(snap.exists() ? userFromMap(snap.data()) : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      setFirebaseUser(u);
      await fetchProfile(u);
      setLoading(false);
    });
    return unsub;
  }, [fetchProfile]);

  const refreshUser = useCallback(async () => {
    await fetchProfile(firebaseAuth.currentUser);
  }, [fetchProfile]);

  const value = useMemo(
    () => ({ firebaseUser, user, loading, refreshUser }),
    [firebaseUser, user, loading, refreshUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx { return useContext(Ctx); }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";

export default function SplashPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading || !waited) return;
    if (firebaseUser) router.replace("/home");
    else router.replace("/login");
  }, [loading, waited, firebaseUser, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-wealth-gradient px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="text-7xl animate-scale-in">🏦</div>
        <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Kanban Finance
          </h1>
          <p className="mt-2 text-lg font-light tracking-[0.5em] text-accent-cyan">
            SYSTEM
          </p>
        </div>
        <div className="mt-8 spinner" />
      </div>
    </main>
  );
}

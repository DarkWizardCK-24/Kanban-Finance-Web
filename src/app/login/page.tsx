"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa6";
import { TextField } from "@/components/common/TextField";
import { useToast } from "@/components/common/Toast";
import { AuthService } from "@/lib/authService";
import { Validators } from "@/lib/validators";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next = {
      email: Validators.email(email),
      password: Validators.password(password),
    };
    setErrors(next);
    return !next.email && !next.password;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await AuthService.login(email.trim(), password);
      router.replace("/home");
    } catch (err: any) {
      toast.show(err?.message ?? "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    if (!email.trim()) {
      toast.show("Enter your email first to reset password", "error");
      return;
    }
    try {
      await AuthService.resetPassword(email.trim());
      toast.show("Password reset email sent! 📧", "success");
    } catch (err: any) {
      toast.show(err?.message ?? "Reset failed", "error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-dark-bg px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="text-center animate-fade-in">
          <div className="text-6xl">🏦</div>
          <h1 className="mt-4 text-3xl font-extrabold text-text-primary sm:text-4xl">
            Welcome Back! <span aria-hidden>👋</span>
          </h1>
          <p className="mt-2 text-sm text-text-secondary">Login to manage your finances</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-10 space-y-4 rounded-2xl border border-dark-border bg-dark-surface/60 p-6 shadow-card backdrop-blur-sm sm:p-8 animate-fade-in"
          style={{ animationDelay: "150ms" }}
        >
          <TextField
            label="Email"
            hint="Enter your email"
            type="email"
            autoComplete="email"
            prefix={<FaEnvelope size={14} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Password"
            hint="Enter your password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            prefix={<FaLock size={14} />}
            suffix={
              <button type="button" onClick={() => setShowPwd((s) => !s)} className="px-1 text-text-hint focus-ring">
                {showPwd ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <div className="flex justify-end">
            <button type="button" onClick={onForgotPassword}
              className="text-xs font-semibold text-accent-cyan hover:underline">
              Forgot Password? 🔑
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="spinner" /> : <>Login <span aria-hidden>🚀</span></>}
          </button>

          <div className="pt-2 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-accent-cyan hover:underline">
              Register ✨
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

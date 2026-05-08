"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUser, FaEnvelope, FaPhone, FaLock, FaShieldHalved, FaCakeCandles,
  FaEye, FaEyeSlash, FaArrowLeft,
} from "react-icons/fa6";
import { TextField } from "@/components/common/TextField";
import { useToast } from "@/components/common/Toast";
import { AuthService } from "@/lib/authService";
import { Validators } from "@/lib/validators";
import { calculateAge } from "@/lib/models";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const age = useMemo(() => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    return calculateAge(d);
  }, [dob]);

  function validate(): boolean {
    const next = {
      name: Validators.required(name, "Name"),
      email: Validators.email(email),
      phone: Validators.phone(phone),
      dob: dob ? null : "Date of birth is required",
      pwd: Validators.password(pwd),
      confirm: Validators.confirmPassword(confirm, pwd),
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await AuthService.register({
        email: email.trim(),
        password: pwd,
        name: name.trim(),
        phone: phone.trim(),
        dateOfBirth: new Date(dob),
      });
      router.replace("/home");
    } catch (err: any) {
      toast.show(err?.message ?? "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-dark-bg">
      <header className="sticky top-0 z-10 border-b border-dark-border bg-dark-surface/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-text-primary hover:bg-dark-card focus-ring">
            <FaArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold text-text-primary">Create Account ✨</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="text-center animate-fade-in">
          <h2 className="text-2xl font-extrabold text-text-primary">Join Kanban Finance 🚀</h2>
          <p className="mt-1.5 text-sm text-text-secondary">Create your account to start managing wealth</p>
        </div>

        <form onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-dark-border bg-dark-surface/60 p-6 shadow-card sm:p-8 animate-fade-in">
          <TextField
            label="Full Name" hint="Enter your full name"
            prefix={<FaUser size={14} />}
            value={name} onChange={(e) => setName(e.target.value)} error={errors.name}
          />
          <TextField
            label="Email" hint="Enter your email" type="email" autoComplete="email"
            prefix={<FaEnvelope size={14} />}
            value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email}
          />
          <TextField
            label="Phone Number" hint="Enter phone number" type="tel" autoComplete="tel"
            prefix={<FaPhone size={14} />}
            value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone}
          />
          <TextField
            label="Date of Birth 📅" type="date"
            prefix={<FaCakeCandles size={14} />}
            value={dob} onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            error={errors.dob}
          />
          {age !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-light-green px-4 py-2.5 text-sm font-semibold text-accent-green animate-fade-in">
              <span>🎂</span><span>Age: {age} years</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Password" hint="Create a password"
              type={showPwd ? "text" : "password"}
              prefix={<FaLock size={14} />}
              suffix={
                <button type="button" onClick={() => setShowPwd((s) => !s)} className="px-1 text-text-hint focus-ring">
                  {showPwd ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              }
              value={pwd} onChange={(e) => setPwd(e.target.value)} error={errors.pwd}
            />
            <TextField
              label="Confirm Password" hint="Confirm your password"
              type={showConfirm ? "text" : "password"}
              prefix={<FaShieldHalved size={14} />}
              suffix={
                <button type="button" onClick={() => setShowConfirm((s) => !s)} className="px-1 text-text-hint focus-ring">
                  {showConfirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              }
              value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <span className="spinner" /> : <>Create Account <span aria-hidden>🎉</span></>}
          </button>

          <div className="pt-2 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-accent-cyan hover:underline">Login 🔐</Link>
          </div>
        </form>
      </div>
    </main>
  );
}

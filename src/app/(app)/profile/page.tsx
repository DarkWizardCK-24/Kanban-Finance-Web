"use client";

import { useState } from "react";
import {
  FaUser, FaEnvelope, FaPhone, FaCakeCandles, FaCalendarDays,
  FaPenToSquare, FaCheck,
} from "react-icons/fa6";
import { useAuth } from "@/lib/authContext";
import { calculateAge, userInitials } from "@/lib/models";
import { Avatar } from "@/components/common/Avatar";
import { TextField } from "@/components/common/TextField";
import { useToast } from "@/components/common/Toast";
import { Validators } from "@/lib/validators";
import { Formatters } from "@/lib/formatters";
import { AuthService } from "@/lib/authService";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dob, setDob] = useState(
    user ? user.dateOfBirth.toISOString().slice(0, 10) : "",
  );
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  if (!user) return null;
  const dobDate = dob ? new Date(dob) : user.dateOfBirth;
  const age = calculateAge(dobDate);

  async function onSave() {
    const next = {
      name: Validators.required(name, "Name"),
      phone: Validators.phone(phone),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    if (!user) return;
    setSaving(true);
    try {
      await AuthService.updateUser({
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        dateOfBirth: dobDate,
        age,
        updatedAt: new Date(),
      });
      await refreshUser();
      toast.show("Profile updated ✅", "success");
      setEditing(false);
    } catch (err: any) {
      toast.show(err?.message ?? "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center animate-fade-in">
        <Avatar initials={userInitials(user.name)} size={84} />
        <h1 className="mt-2 text-2xl font-extrabold text-text-primary">{user.name}</h1>
        <p className="text-sm font-semibold text-accent-cyan">{user.id}</p>
        <p className="text-sm text-text-secondary">{user.email}</p>
      </div>

      {!editing ? (
        <div className="mt-7 space-y-3">
          <InfoRow icon={<FaUser size={14} />} emoji="👤" label="Full Name" value={user.name} />
          <InfoRow icon={<FaEnvelope size={14} />} emoji="📧" label="Email" value={user.email} />
          <InfoRow icon={<FaPhone size={14} />} emoji="📱" label="Phone" value={user.phone} />
          <InfoRow icon={<FaCakeCandles size={14} />} emoji="🎂" label="Date of Birth" value={Formatters.date(user.dateOfBirth)} />
          <InfoRow icon={<FaCalendarDays size={14} />} emoji="🎯" label="Age" value={`${user.age} years`} />

          <button onClick={() => setEditing(true)} className="btn-outline mt-4 w-full">
            <FaPenToSquare size={13} /> Edit Profile
          </button>
        </div>
      ) : (
        <div className="mt-7 space-y-4 animate-fade-in">
          <TextField label="Full Name 👤" prefix={<FaUser size={14} />}
            value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <TextField label="Phone 📱" type="tel" prefix={<FaPhone size={14} />}
            value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
          <TextField label="Date of Birth 🎂" type="date" prefix={<FaCakeCandles size={14} />}
            value={dob} onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().slice(0, 10)} />
          <div className="flex items-center gap-2 rounded-xl bg-light-green px-4 py-2.5 text-sm font-semibold text-accent-green">
            <span>🎯</span> Age: {age} years (auto-calculated)
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditing(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={onSave} disabled={saving} className="btn-primary flex-1">
              {saving ? <span className="spinner" /> : <><FaCheck size={13} /> Save</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, emoji, label, value }: {
  icon: React.ReactNode; emoji: string; label: string; value: string;
}) {
  return (
    <div className="surface-card flex items-center gap-3 p-4 shadow-card animate-slide-x">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-light-green text-accent-green">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-hint">{emoji} {label}</p>
        <p className="truncate text-sm font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

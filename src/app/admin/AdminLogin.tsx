"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size, borderWidth: 2, borderColor: "currentColor", borderTopColor: "transparent" }}
      className="inline-block rounded-full animate-spin border-solid"
    />
  );
}

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const Sun = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const Moon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const Heart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("admin-dark") === "1") setDark(true);
  }, []);

  const toggleDark = () =>
    setDark(d => { const n = !d; localStorage.setItem("admin-dark", n ? "1" : "0"); return n; });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Credenciales incorrectas"); return; }
      router.refresh();
      router.push("/admin");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const D = dark;
  const bg      = D ? "bg-gray-950" : "bg-slate-100";
  const card    = D ? "bg-gray-900 border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900";
  const label   = D ? "text-gray-300" : "text-gray-700";
  const muted   = D ? "text-gray-400" : "text-gray-500";
  const inputCls = D
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-[#901F1A] focus:ring-1 focus:ring-[#901F1A]/50"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#901F1A] focus:ring-1 focus:ring-[#901F1A]/30";
  const eyeBtn  = D ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600";

  if (!mounted) return null;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200 ${bg}`}>

      {/* Theme toggle */}
      <div className="w-full max-w-sm flex justify-end mb-3">
        <button
          onClick={toggleDark}
          title="Cambiar tema"
          className={`p-2 rounded-lg transition ${D ? "text-yellow-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-200"}`}
        >
          {D ? <Sun /> : <Moon />}
        </button>
      </div>

      {/* Card */}
      <div className={`w-full max-w-sm rounded-2xl border shadow-xl overflow-hidden ${card}`}>

        {/* Card header */}
        <div className="bg-[#901F1A] px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Heart />
          </div>
          <div>
            <p className="text-white font-bold text-base tracking-tight leading-tight">Panel de Invitados</p>
            <p className="text-white/70 text-xs mt-0.5">Acceso administrativo</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-6">
          <form onSubmit={submit} className="space-y-4">

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${label}`}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@ejemplo.com"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`}
              />
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${label}`}>Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition ${inputCls}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                  className={`absolute inset-y-0 right-3 flex items-center transition ${eyeBtn}`}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2.5 rounded-xl bg-[#901F1A] text-white text-sm font-semibold hover:bg-[#7a1916] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Spinner size={14} /> Verificando…</> : "Entrar"}
            </button>

          </form>

          <p className={`text-center text-xs mt-5 ${muted}`}>Panel administrativo</p>
        </div>
      </div>
    </div>
  );
}

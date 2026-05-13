"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type InvitadoRow = {
  id: number;
  nombre: string;
  numero: string;
  pases: number;
  mesa: string | null;
  confirmado: boolean;
  pasesConfirmados: number;
  fechaConfirmacion: string | null;
};
type ToastMsg = { type: "success" | "error"; text: string } | null;
type SortCol = "confirmado" | "nombre" | "numero" | "mesa" | "pases" | "pasesConfirmados" | "fechaConfirmacion";

function fmt(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

const LIMIT = 10;

/* ─── Icons ─── */
const Ic = {
  Users:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Check:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Clock:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Person:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
  Sun:      () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Edit:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
  Trash:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Reset:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Logout:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Plus:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Heart:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Empty:    () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size, borderWidth: 2, borderColor: "currentColor", borderTopColor: "transparent" }}
      className="inline-block rounded-full animate-spin border-solid"
    />
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [invitados, setInvitados] = useState<InvitadoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalInvitados, setTotalInvitados] = useState(0);
  const [totalConfirmados, setTotalConfirmados] = useState(0);
  const [totalPendientes, setTotalPendientes] = useState(0);
  const [totalPersonas, setTotalPersonas] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<"todos" | "confirmados" | "pendientes">("todos");
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [sortBy, setSortBy] = useState<SortCol>("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [toast, setToast] = useState<ToastMsg>(null);
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [invitadoToEdit, setInvitadoToEdit] = useState<InvitadoRow | null>(null);
  const [invitadoToEliminar, setInvitadoToEliminar] = useState<InvitadoRow | null>(null);
  const [invitadoToReset, setInvitadoToReset] = useState<InvitadoRow | null>(null);
  const [modalResetOpen, setModalResetOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formNumero, setFormNumero] = useState("");
  const [formPases, setFormPases] = useState(1);
  const [formMesa, setFormMesa] = useState("");

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("admin-dark") === "1") setDark(true);
  }, []);

  const toggleDark = () =>
    setDark(d => { const n = !d; localStorage.setItem("admin-dark", n ? "1" : "0"); return n; });

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleSort = (col: SortCol) => {
    if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
    setPage(1);
  };

  const fetchInvitados = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT), estado, sortBy, sortOrder });
    if (search.trim()) p.set("search", search.trim());
    const res = await fetch(`/api/admin/invitados?${p}`);
    if (res.status === 401) { router.refresh(); return; }
    const data = await res.json();
    setInvitados(data.invitados ?? []);
    setTotal(data.total ?? 0);
    setTotalInvitados(data.totalInvitados ?? 0);
    setTotalConfirmados(data.totalConfirmados ?? 0);
    setTotalPendientes(data.totalPendientes ?? 0);
    setTotalPersonas(data.totalPersonas ?? 0);
    setLoading(false);
    setFirstLoad(false);
  };

  useEffect(() => { fetchInvitados(); }, [page, estado, sortBy, sortOrder]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchInvitados(); };
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.refresh(); router.push("/admin"); };
  const exportCsv = () => window.open("/api/admin/invitados/csv", "_blank");

  const openAgregar = () => { setFormNombre(""); setFormNumero(""); setFormPases(1); setFormMesa(""); setFormError(""); setModalAgregarOpen(true); };
  const openEditar = (inv: InvitadoRow) => { setInvitadoToEdit(inv); setFormNombre(inv.nombre); setFormNumero(inv.numero); setFormPases(inv.pases); setFormMesa(inv.mesa ?? ""); setFormError(""); setModalEditarOpen(true); };
  const closeEditar = () => { setModalEditarOpen(false); setInvitadoToEdit(null); };
  const openEliminar = (inv: InvitadoRow) => { setInvitadoToEliminar(inv); setModalEliminarOpen(true); };
  const closeEliminar = () => { setModalEliminarOpen(false); setInvitadoToEliminar(null); };
  const openReset = (inv: InvitadoRow) => { setInvitadoToReset(inv); setModalResetOpen(true); };
  const closeReset = () => { setModalResetOpen(false); setInvitadoToReset(null); };

  const confirmarReset = async () => {
    if (!invitadoToReset) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/invitados/${invitadoToReset.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmado: false, pasesConfirmados: 0, fechaConfirmacion: null }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "Error"); return; }
      closeReset(); showToast("success", "Restablecido. El invitado puede confirmar de nuevo."); fetchInvitados();
    } catch { showToast("error", "Error de conexión"); } finally { setFormLoading(false); }
  };

  const submitAgregar = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError("");
    const numero = formNumero.replace(/\D/g, "").trim();
    if (!numero || !formNombre.trim()) { setFormError("Nombre y teléfono son obligatorios"); return; }
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/invitados", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: formNombre.trim(), numero, pases: formPases, mesa: formMesa.trim() || undefined }) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Error"); return; }
      setModalAgregarOpen(false); showToast("success", "Invitado agregado con éxito"); fetchInvitados();
    } catch { setFormError("Error de conexión"); } finally { setFormLoading(false); }
  };

  const submitEditar = async (e: React.FormEvent) => {
    e.preventDefault(); if (!invitadoToEdit) return; setFormError("");
    const numero = formNumero.replace(/\D/g, "").trim();
    if (!numero || !formNombre.trim()) { setFormError("Nombre y teléfono son obligatorios"); return; }
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/invitados/${invitadoToEdit.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: formNombre.trim(), numero, pases: formPases, mesa: formMesa.trim() || undefined }) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Error"); return; }
      closeEditar(); showToast("success", "Invitado actualizado"); fetchInvitados();
    } catch { setFormError("Error de conexión"); } finally { setFormLoading(false); }
  };

  const confirmarEliminar = async () => {
    if (!invitadoToEliminar) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/invitados/${invitadoToEliminar.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error ?? "Error"); return; }
      closeEliminar(); showToast("success", "Invitado eliminado"); fetchInvitados();
    } catch { showToast("error", "Error de conexión"); } finally { setFormLoading(false); }
  };

  /* ─── Theme helpers ─── */
  const D = dark;
  const bg        = D ? "bg-gray-950"  : "bg-slate-100";
  const bgCard    = D ? "bg-gray-900 border-gray-800"  : "bg-white border-gray-200";
  const bgHead    = D ? "bg-gray-900 border-gray-800"  : "bg-white border-gray-200";
  const bgThead   = D ? "bg-gray-800/60" : "bg-gray-50";
  const text      = D ? "text-gray-100" : "text-gray-900";
  const textMuted = D ? "text-gray-400" : "text-gray-500";
  const textLabel = D ? "text-gray-300" : "text-gray-700";
  const divider   = D ? "border-gray-800" : "border-gray-200";
  const rowHover  = D ? "hover:bg-gray-800/60" : "hover:bg-slate-50";
  const inputCls  = D
    ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-[#901F1A] focus:ring-1 focus:ring-[#901F1A]/50"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#901F1A] focus:ring-1 focus:ring-[#901F1A]/30";
  const btnGhost  = D
    ? "border-gray-700 text-gray-300 hover:bg-gray-800"
    : "border-gray-300 text-gray-600 hover:bg-gray-100";

  const totalPages = Math.ceil(total / LIMIT);

  /* ─── Pagination page numbers ─── */
  const pageNums = (): number[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  /* ─── Form fields (shared) ─── */
  const formFields = (
    <div className="space-y-4">
      {[
        { label: "Nombre / Familia", type: "text", value: formNombre, onChange: (v: string) => setFormNombre(v), placeholder: "Ej. Fam. García" },
      ].map(f => (
        <div key={f.label}>
          <label className={`block text-sm font-medium mb-1.5 ${textLabel}`}>{f.label}</label>
          <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} required placeholder={f.placeholder} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`} />
        </div>
      ))}
      <div>
        <label className={`block text-sm font-medium mb-1.5 ${textLabel}`}>Teléfono (10 dígitos)</label>
        <input type="tel" inputMode="numeric" autoComplete="tel" value={fmt(formNumero)} onChange={e => setFormNumero(e.target.value.replace(/\D/g, "").slice(0, 10))} required placeholder="961 238 5401" maxLength={12} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${textLabel}`}>Pases</label>
          <input type="number" min={1} max={20} value={formPases} onChange={e => setFormPases(Math.max(1, parseInt(e.target.value, 10) || 1))} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`} />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${textLabel}`}>Mesa (opcional)</label>
          <input type="text" value={formMesa} onChange={e => setFormMesa(e.target.value)} placeholder="Mesa 1" className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition ${inputCls}`} />
        </div>
      </div>
    </div>
  );

  /* ─── Modal shell ─── */
  const modalShell = (title: string, onClose: () => void, children: React.ReactNode) =>
    mounted ? createPortal(
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className={`${D ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"} rounded-2xl shadow-2xl w-full max-w-md`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
            <h3 className="font-semibold text-base">{title}</h3>
            <button onClick={onClose} className={`${textMuted} hover:${text} transition`}><Ic.X /></button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>,
      document.body
    ) : null;

  const formBtns = (onCancel: () => void, submitLabel: string) => (
    <div className="flex gap-2 pt-2">
      <button type="button" onClick={onCancel} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${btnGhost}`}>Cancelar</button>
      <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-[#901F1A] text-white text-sm font-semibold hover:bg-[#7a1916] transition disabled:opacity-60 flex items-center justify-center gap-2">
        {formLoading ? <><Spinner size={14} /> {submitLabel}…</> : submitLabel}
      </button>
    </div>
  );

  /* ─── Render ─── */
  return (
    <div className={`min-h-screen transition-colors duration-200 ${bg} ${text}`}>

      {/* Toast */}
      {mounted && toast && createPortal(
        <div className={`fixed top-4 right-4 z-[99999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success"
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {toast.text}
        </div>,
        document.body
      )}

      {/* ── Header ── */}
      <header className={`sticky top-0 z-40 border-b ${bgHead} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#901F1A] flex items-center justify-center shrink-0"><Ic.Heart /></div>
            <span className="font-bold text-base sm:text-lg tracking-tight truncate">Panel de Invitados</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={toggleDark} title="Cambiar tema" className={`p-2 rounded-lg transition ${D ? "text-yellow-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"}`}>
              {D ? <Ic.Sun /> : <Ic.Moon />}
            </button>
            <button onClick={exportCsv} className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${btnGhost}`}>
              <Ic.Download /> Exportar CSV
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#901F1A] text-white text-xs font-semibold hover:bg-[#7a1916] transition">
              <Ic.Logout /> <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {([
            { label: "Total invitados", value: totalInvitados, color: "#901F1A", icon: <Ic.Users /> },
            { label: "Confirmados",     value: totalConfirmados, color: "#16a34a", icon: <Ic.Check /> },
            { label: "Pendientes",      value: totalPendientes,  color: "#d97706", icon: <Ic.Clock /> },
            { label: "Total personas",  value: totalPersonas,    color: "#2563eb", icon: <Ic.Person /> },
          ] as const).map(s => (
            <div key={s.label} className={`rounded-2xl p-4 border ${bgCard} shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <p className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>{s.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}18`, color: s.color }}>
                  {s.icon}
                </div>
              </div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${bgCard}`}>

          {/* Toolbar */}
          <div className={`p-4 border-b ${divider}`}>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none ${textMuted}`}><Ic.Search /></div>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono…" className={`w-full rounded-xl border pl-9 pr-4 py-2 text-sm outline-none transition ${inputCls}`} />
                </div>
                <select value={estado} onChange={e => { setEstado(e.target.value as typeof estado); setPage(1); }} className={`rounded-xl border px-3 py-2 text-sm outline-none transition shrink-0 ${inputCls}`}>
                  <option value="todos">Todos</option>
                  <option value="confirmados">Confirmados</option>
                  <option value="pendientes">Pendientes</option>
                </select>
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#901F1A] text-white text-sm font-semibold hover:bg-[#7a1916] transition shrink-0">
                  <Ic.Search /><span className="hidden sm:inline">Buscar</span>
                </button>
              </form>
              <button onClick={openAgregar} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shrink-0">
                <Ic.Plus /> Agregar
              </button>
            </div>
          </div>

          {/* Table area */}
          <div className="relative overflow-x-auto">
            {loading && !firstLoad && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 gap-2 ${D ? "bg-gray-900/70" : "bg-white/70"} backdrop-blur-[1px]`}>
                <Spinner size={24} />
                <span className={`text-xs ${textMuted}`}>Actualizando…</span>
              </div>
            )}
            <table className="w-full text-sm" style={{ minWidth: 640 }}>
              <thead>
                <tr className={`border-b ${divider} ${bgThead}`}>
                  {([
                    ["confirmado", "Estado"],
                    ["nombre", "Familia"],
                    ["numero", "Teléfono"],
                    ["mesa", "Mesa"],
                    ["pases", "Pases"],
                    ["pasesConfirmados", "Confirm."],
                    ["fechaConfirmacion", "Fecha"],
                  ] as [SortCol, string][]).map(([col, label]) => (
                    <th key={col} className={`text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide ${textMuted}`}>
                      <button type="button" onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:opacity-70 transition">
                        {label}
                        {sortBy === col && <span className="text-[#901F1A] text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    </th>
                  ))}
                  <th className={`text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${divider}`}>
                {loading && firstLoad ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="py-3.5 px-3">
                          <div className={`h-3.5 rounded-full ${D ? "bg-gray-800" : "bg-gray-100"}`} style={{ width: `${35 + (j * 11 + i * 9) % 50}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : invitados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className={`flex flex-col items-center gap-3 ${textMuted}`}>
                        <Ic.Empty />
                        <p className="text-sm">No se encontraron invitados</p>
                      </div>
                    </td>
                  </tr>
                ) : invitados.map(inv => (
                  <tr key={inv.id} className={`transition-colors ${rowHover}`}>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${inv.confirmado ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inv.confirmado ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {inv.confirmado ? "Confirmado" : "Pendiente"}
                      </span>
                    </td>
                    <td className={`py-3 px-3 font-medium ${text}`}>{inv.nombre}</td>
                    <td className={`py-3 px-3 font-mono text-xs ${textMuted}`}>{inv.numero}</td>
                    <td className={`py-3 px-3 text-xs ${textMuted}`}>{inv.mesa ?? "—"}</td>
                    <td className={`py-3 px-3 text-center font-semibold ${text}`}>{inv.pases}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-semibold text-sm ${inv.pasesConfirmados > 0 ? "text-emerald-600" : textMuted}`}>{inv.pasesConfirmados}</span>
                    </td>
                    <td className={`py-3 px-3 text-xs ${textMuted}`}>{fmtDate(inv.fechaConfirmacion)}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-0.5 items-center">
                        {inv.confirmado
                          ? <button onClick={() => openReset(inv)} title="Restablecer" className="p-2 rounded-lg text-amber-600 hover:bg-amber-100 transition"><Ic.Reset /></button>
                          : <button onClick={() => openEditar(inv)} title="Editar" className="p-2 rounded-lg text-[#901F1A] hover:bg-[#901F1A]/10 transition"><Ic.Edit /></button>}
                        <button onClick={() => openEliminar(inv)} title="Eliminar" className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition"><Ic.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!firstLoad && total > 0 && (
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${divider}`}>
              <p className={`text-xs ${textMuted}`}>
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de <strong>{total}</strong> invitados
              </p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed ${btnGhost}`}>
                  ← Ant.
                </button>
                {pageNums().map(n => (
                  <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${n === page ? "bg-[#901F1A] text-white shadow-sm" : `${D ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}`}>
                    {n}
                  </button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed ${btnGhost}`}>
                  Sig. →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile CSV */}
        <div className="sm:hidden">
          <button onClick={exportCsv} className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${btnGhost}`}>
            <Ic.Download /> Exportar CSV
          </button>
        </div>

      </main>

      {/* ── Modals ── */}

      {modalAgregarOpen && modalShell("Agregar invitado", () => setModalAgregarOpen(false),
        <form onSubmit={submitAgregar}>
          {formFields}
          {formError && <p className="text-xs text-red-500 mt-3">{formError}</p>}
          {formBtns(() => setModalAgregarOpen(false), "Guardar")}
        </form>
      )}

      {modalEditarOpen && invitadoToEdit && modalShell(`Editar — ${invitadoToEdit.nombre}`, closeEditar,
        <form onSubmit={submitEditar}>
          {formFields}
          {formError && <p className="text-xs text-red-500 mt-3">{formError}</p>}
          {formBtns(closeEditar, "Guardar")}
        </form>
      )}

      {modalEliminarOpen && invitadoToEliminar && modalShell("Eliminar invitado", closeEliminar,
        <>
          <div className="text-center space-y-3 mb-5">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600"><Ic.Trash /></div>
            <p className={`text-sm ${textMuted}`}>¿Eliminar a <strong className={text}>{invitadoToEliminar.nombre}</strong>? Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={closeEliminar} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${btnGhost}`}>Cancelar</button>
            <button onClick={confirmarEliminar} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {formLoading ? <><Spinner size={14} /> Eliminando…</> : "Eliminar"}
            </button>
          </div>
        </>
      )}

      {modalResetOpen && invitadoToReset && modalShell("Restablecer invitado", closeReset,
        <>
          <div className="text-center space-y-3 mb-5">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600"><Ic.Reset /></div>
            <p className={`text-sm ${textMuted}`}>
              ¿Restablecer a <strong className={text}>{invitadoToReset.nombre}</strong>?<br />
              Volverá a estado <strong>Pendiente</strong> y podrá confirmar de nuevo.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={closeReset} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${btnGhost}`}>Cancelar</button>
            <button onClick={confirmarReset} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {formLoading ? <><Spinner size={14} /> Restableciendo…</> : "Restablecer"}
            </button>
          </div>
        </>
      )}

    </div>
  );
}

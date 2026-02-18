"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

type ToastMessage = { type: "success" | "error"; text: string } | null;

/** Formato visual teléfono: "XXX XXX XXXX" (solo dígitos, máx 10). */
function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export default function AdminDashboard() {
  const router = useRouter();
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
  const limit = 20;
  type SortColumn = "confirmado" | "nombre" | "numero" | "mesa" | "pases" | "pasesConfirmados" | "fechaConfirmacion";
  const [sortBy, setSortBy] = useState<SortColumn>("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [toast, setToast] = useState<ToastMessage>(null);
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

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleSort = (col: SortColumn) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const SortTh = ({ col, label }: { col: SortColumn; label: string }) => (
    <th className="text-left py-2 px-2 text-[#D15366]">
      <button type="button" onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:underline focus:outline-none">
        {label}
        {sortBy === col && <span aria-hidden>{sortOrder === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );

  const fetchInvitados = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      estado,
      sortBy,
      sortOrder,
    });
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/admin/invitados?${params}`);
    if (res.status === 401) {
      router.refresh();
      return;
    }
    const data = await res.json();
    setInvitados(data.invitados ?? []);
    setTotal(data.total ?? 0);
    setTotalInvitados(data.totalInvitados ?? 0);
    setTotalConfirmados(data.totalConfirmados ?? 0);
    setTotalPendientes(data.totalPendientes ?? 0);
    setTotalPersonas(data.totalPersonas ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitados();
  }, [page, estado, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInvitados();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
    router.push("/admin");
  };

  const exportCsv = () => {
    window.open("/api/admin/invitados/csv", "_blank");
  };

  const openAgregar = () => {
    setFormNombre("");
    setFormNumero("");
    setFormPases(1);
    setFormMesa("");
    setFormError("");
    setModalAgregarOpen(true);
  };

  const openEditar = (inv: InvitadoRow) => {
    setInvitadoToEdit(inv);
    setFormNombre(inv.nombre);
    setFormNumero(inv.numero);
    setFormPases(inv.pases);
    setFormMesa(inv.mesa ?? "");
    setFormError("");
    setModalEditarOpen(true);
  };

  const closeEditar = () => {
    setModalEditarOpen(false);
    setInvitadoToEdit(null);
  };

  const openEliminar = (inv: InvitadoRow) => {
    setInvitadoToEliminar(inv);
    setModalEliminarOpen(true);
  };

  const closeEliminar = () => {
    setModalEliminarOpen(false);
    setInvitadoToEliminar(null);
  };

  const openReset = (inv: InvitadoRow) => {
    setInvitadoToReset(inv);
    setModalResetOpen(true);
  };

  const closeReset = () => {
    setModalResetOpen(false);
    setInvitadoToReset(null);
  };

  const confirmarReset = async () => {
    if (!invitadoToReset) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/invitados/${invitadoToReset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmado: false,
          pasesConfirmados: 0,
          fechaConfirmacion: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error ?? "Error al restablecer");
        return;
      }
      closeReset();
      showToast("success", "Se restableció correctamente. El invitado puede volver a confirmar.");
      fetchInvitados();
    } catch {
      showToast("error", "Error de conexión");
    } finally {
      setFormLoading(false);
    }
  };

  const submitAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const numero = formNumero.replace(/\D/g, "").trim();
    if (!numero || !formNombre.trim()) {
      setFormError("Nombre y teléfono son obligatorios");
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/invitados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formNombre.trim(),
          numero,
          pases: formPases,
          mesa: formMesa.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Error al guardar");
        return;
      }
      setModalAgregarOpen(false);
      showToast("success", "Se guardó con éxito");
      fetchInvitados();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setFormLoading(false);
    }
  };

  const submitEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitadoToEdit) return;
    setFormError("");
    const numero = formNumero.replace(/\D/g, "").trim();
    if (!numero || !formNombre.trim()) {
      setFormError("Nombre y teléfono son obligatorios");
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/invitados/${invitadoToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formNombre.trim(),
          numero,
          pases: formPases,
          mesa: formMesa.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Error al actualizar");
        return;
      }
      closeEditar();
      showToast("success", "Se editó con éxito");
      fetchInvitados();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!invitadoToEliminar) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/invitados/${invitadoToEliminar.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error ?? "Error al eliminar");
        return;
      }
      closeEliminar();
      showToast("success", "Se eliminó con éxito");
      fetchInvitados();
    } catch {
      showToast("error", "Error de conexión");
    } finally {
      setFormLoading(false);
    }
  };

  const formFields = (
    <>
      <div>
        <label className="block text-sm font-medium text-[#D15366] mb-1">Nombre / Familia</label>
        <input
          type="text"
          value={formNombre}
          onChange={(e) => setFormNombre(e.target.value)}
          required
          className="w-full rounded-xl border-2 border-[#D15366]/50 px-4 py-2 text-[#D15366]"
          placeholder="Ej. Fam. García"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#D15366] mb-1">Teléfono (10 dígitos)</label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={formatPhoneDisplay(formNumero)}
          onChange={(e) => setFormNumero(e.target.value.replace(/\D/g, "").slice(0, 10))}
          required
          className="w-full rounded-xl border-2 border-[#D15366]/50 px-4 py-2 text-[#D15366]"
          placeholder="961 238 5401"
          maxLength={12}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#D15366] mb-1">Pases</label>
        <input
          type="number"
          min={1}
          max={20}
          value={formPases}
          onChange={(e) => setFormPases(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-full rounded-xl border-2 border-[#D15366]/50 px-4 py-2 text-[#D15366]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#D15366] mb-1">Mesa (opcional)</label>
        <input
          type="text"
          value={formMesa}
          onChange={(e) => setFormMesa(e.target.value)}
          className="w-full rounded-xl border-2 border-[#D15366]/50 px-4 py-2 text-[#D15366]"
          placeholder="Ej. Mesa 1"
        />
      </div>
    </>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl shadow-lg text-white font-medium ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-[#D15366]">Panel de invitados</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border-2 border-[#D15366] px-4 py-2 text-sm font-bold uppercase text-[#D15366] hover:bg-[#D15366]/10"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl bg-[#D15366] px-4 py-2 text-sm font-bold uppercase text-white hover:bg-[#b84556]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white p-4 shadow text-center">
          <p className="text-sm text-gray-600">Total invitados</p>
          <p className="text-2xl font-bold text-[#D15366]">{totalInvitados}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow text-center">
          <p className="text-sm text-gray-600">Confirmados</p>
          <p className="text-2xl font-bold text-green-600">{totalConfirmados}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow text-center">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-amber-600">{totalPendientes}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow text-center">
          <p className="text-sm text-gray-600">Total personas</p>
          <p className="text-2xl font-bold text-[#D15366]">{totalPersonas}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow mb-4">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={openAgregar}
            className="rounded-xl border-2 border-green-600 px-4 py-2 text-sm font-bold uppercase text-green-600 hover:bg-green-600/10"
          >
            Agregar invitado
          </button>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className="flex-1 min-w-[180px] rounded-xl border-2 border-[#D15366]/50 px-4 py-2 text-[#D15366]"
          />
          <select
            value={estado}
            onChange={(e) => { setEstado(e.target.value as "todos" | "confirmados" | "pendientes"); setPage(1); }}
            className="rounded-xl border-2 border-[#D15366]/50 px-4 py-2 text-[#D15366]"
          >
            <option value="todos">Todos</option>
            <option value="confirmados">Confirmados</option>
            <option value="pendientes">Pendientes</option>
          </select>
          <button type="submit" className="rounded-xl bg-[#D15366] px-4 py-2 text-sm font-bold uppercase text-white">
            Buscar
          </button>
        </form>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Cargando...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D15366]/30">
                    <SortTh col="confirmado" label="Estado" />
                    <SortTh col="nombre" label="Familia" />
                    <SortTh col="numero" label="Teléfono" />
                    <SortTh col="mesa" label="Mesa" />
                    <SortTh col="pases" label="Pases" />
                    <SortTh col="pasesConfirmados" label="Confirmadas" />
                    <SortTh col="fechaConfirmacion" label="Fecha" />
                    <th className="text-left py-2 px-2 text-[#D15366]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invitados.map((i) => (
                    <tr key={i.id} className="border-b border-gray-200">
                      <td className="py-2 px-2">
                        <span className={i.confirmado ? "text-green-600 font-medium" : "text-amber-600"}>
                          {i.confirmado ? "Confirmado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-800">{i.nombre}</td>
                      <td className="py-2 px-2 text-gray-800">{i.numero}</td>
                      <td className="py-2 px-2 text-gray-800">{i.mesa ?? "—"}</td>
                      <td className="py-2 px-2 text-gray-800">{i.pases}</td>
                      <td className="py-2 px-2 text-gray-800">{i.pasesConfirmados}</td>
                      <td className="py-2 px-2 text-gray-800">
                        {i.fechaConfirmacion ? new Date(i.fechaConfirmacion).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-4 items-center flex-wrap">
                          {i.confirmado ? (
                            <button
                              type="button"
                              onClick={() => openReset(i)}
                              title="Resetear"
                              aria-label="Resetear"
                              className="rounded-xl  border-amber-600 p-2.5 text-amber-600 hover:bg-amber-600/10 active:bg-amber-600/20 min-w-[12px] min-h-[12px] flex items-center justify-center touch-manipulation"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditar(i)}
                              title="Editar"
                              aria-label="Editar"
                              className="rounded-xl  border-[#D15366] p-2.5 text-[#D15366] hover:bg-[#D15366]/10 active:bg-[#D15366]/20 min-w-[12px] min-h-[12px] flex items-center justify-center touch-manipulation"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEliminar(i)}
                            title="Eliminar"
                            aria-label="Eliminar"
                            className="rounded-xl  border-red-600 p-2.5 text-red-600 hover:bg-red-600/10 active:bg-red-600/20 min-w-[12px] min-h-[12px] flex items-center justify-center touch-manipulation"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > limit && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                  Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-xl border-2 border-[#D15366] px-3 py-1 text-sm font-bold text-[#D15366] disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page * limit >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl bg-[#D15366] px-3 py-1 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Agregar invitado */}
      {modalAgregarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalAgregarOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-[#D15366]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-4 text-center">Agregar invitado</h3>
            <form onSubmit={submitAgregar} className="flex flex-col gap-3">
              {formFields}
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setModalAgregarOpen(false)} className="flex-1 rounded-xl border-2 border-[#D15366] py-2 text-sm font-bold uppercase text-[#D15366]">Cancelar</button>
                <button type="submit" disabled={formLoading} className="flex-1 rounded-xl bg-[#D15366] py-2 text-sm font-bold uppercase text-white disabled:opacity-60">
                  {formLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar invitado */}
      {modalEditarOpen && invitadoToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeEditar}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-[#D15366]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-4 text-center">Editar invitado</h3>
            <form onSubmit={submitEditar} className="flex flex-col gap-3">
              {formFields}
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={closeEditar} className="flex-1 rounded-xl border-2 border-[#D15366] py-2 text-sm font-bold uppercase text-[#D15366]">Cancelar</button>
                <button type="submit" disabled={formLoading} className="flex-1 rounded-xl bg-[#D15366] py-2 text-sm font-bold uppercase text-white disabled:opacity-60">
                  {formLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar eliminar */}
      {modalEliminarOpen && invitadoToEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeEliminar}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-[#D15366]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-center">Eliminar invitado</h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
              ¿Eliminar a <strong>{invitadoToEliminar.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={closeEliminar} className="flex-1 rounded-xl border-2 border-[#D15366] py-2 text-sm font-bold uppercase text-[#D15366]">Cancelar</button>
              <button
                type="button"
                onClick={confirmarEliminar}
                disabled={formLoading}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-bold uppercase text-white hover:bg-red-700 disabled:opacity-60"
              >
                {formLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar resetear */}
      {modalResetOpen && invitadoToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeReset}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-[#D15366]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-2 text-center">Restablecer invitado</h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
              ¿Restablecer a <strong>{invitadoToReset.nombre}</strong>? Volverá a estado Pendiente y podrá confirmar de nuevo (por si hubo un error).
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={closeReset} className="flex-1 rounded-xl border-2 border-[#D15366] py-2 text-sm font-bold uppercase text-[#D15366]">Cancelar</button>
              <button
                type="button"
                onClick={confirmarReset}
                disabled={formLoading}
                className="flex-1 rounded-xl bg-amber-600 py-2 text-sm font-bold uppercase text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {formLoading ? "Restableciendo..." : "Resetear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

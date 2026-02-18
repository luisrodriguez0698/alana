import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const invitados = await db.invitado.findMany({
    orderBy: { nombre: "asc" },
  });
  const headers = "Estado,Nombre,Número,Pases,Mesa,Confirmadas,Fecha confirmación\n";
  const rows = invitados.map((i) => {
    const estado = i.confirmado ? "Confirmado" : "Pendiente";
    const fecha = i.fechaConfirmacion ? i.fechaConfirmacion.toISOString() : "";
    return `${estado},"${(i.nombre ?? "").replace(/"/g, '""')}",${i.numero},${i.pases},${i.mesa ?? ""},${i.pasesConfirmados},${fecha}`;
  });
  const csv = "\uFEFF" + headers + rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=invitados.csv",
    },
  });
}

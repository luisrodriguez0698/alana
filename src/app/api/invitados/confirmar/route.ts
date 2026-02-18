import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalizarNumero(num: string): string {
  return num.replace(/\D/g, "").trim();
}

/**
 * POST /api/invitados/confirmar
 * Body: { numero: string, asistira: boolean, pasesConfirmados: number }
 * Actualiza confirmado, pasesConfirmados y fechaConfirmacion.
 */
export async function POST(request: NextRequest) {
  let body: { numero?: string; asistira?: boolean; pasesConfirmados?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }
  const { numero: rawNumero, asistira, pasesConfirmados } = body;
  const numero = rawNumero ? normalizarNumero(String(rawNumero)) : "";
  if (!numero) {
    return NextResponse.json({ error: "Falta numero" }, { status: 400 });
  }
  if (typeof asistira !== "boolean") {
    return NextResponse.json({ error: "Falta asistira (true/false)" }, { status: 400 });
  }
  const pases = typeof pasesConfirmados === "number" && pasesConfirmados >= 0
    ? Math.min(pasesConfirmados, 20)
    : (asistira ? 1 : 0);
  try {
    const invitado = await db.invitado.findUnique({ where: { numero } });
    if (!invitado) {
      return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
    }
    await db.invitado.update({
      where: { numero },
      data: {
        confirmado: true,
        pasesConfirmados: asistira ? pases : 0,
        fechaConfirmacion: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al confirmar" }, { status: 500 });
  }
}

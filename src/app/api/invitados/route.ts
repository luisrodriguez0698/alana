import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Normaliza número: solo dígitos, sin espacios. */
function normalizarNumero(num: string): string {
  return num.replace(/\D/g, "").trim();
}

/**
 * GET /api/invitados?numero=9612702139
 * Busca un invitado por número de teléfono.
 */
export async function GET(request: NextRequest) {
  const numero = request.nextUrl.searchParams.get("numero");
  if (!numero) {
    return NextResponse.json({ error: "Falta el parámetro numero" }, { status: 400 });
  }
  const n = normalizarNumero(numero);
  if (!n.length) {
    return NextResponse.json({ error: "Número no válido" }, { status: 400 });
  }
  try {
    const invitado = await db.invitado.findUnique({
      where: { numero: n },
    });
    if (!invitado) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({
      id: invitado.id,
      nombre: invitado.nombre,
      numero: invitado.numero,
      pases: invitado.pases,
      mesa: invitado.mesa,
      confirmado: invitado.confirmado,
      pasesConfirmados: invitado.pasesConfirmados,
      fechaConfirmacion: invitado.fechaConfirmacion?.toISOString() ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al buscar invitado" }, { status: 500 });
  }
}

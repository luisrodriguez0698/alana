import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("unauthorized");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  let body: { nombre?: string; numero?: string; pases?: number; mesa?: string; confirmado?: boolean; pasesConfirmados?: number; fechaConfirmacion?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const data: { nombre?: string; numero?: string; pases?: number; mesa?: string | null; confirmado?: boolean; pasesConfirmados?: number; fechaConfirmacion?: Date | null } = {};
  if (body.nombre !== undefined) data.nombre = String(body.nombre).trim();
  if (body.numero !== undefined) data.numero = String(body.numero).replace(/\D/g, "").trim();
  if (typeof body.pases === "number" && body.pases >= 0) data.pases = body.pases;
  if (body.mesa !== undefined) data.mesa = body.mesa?.trim() || null;
  if (body.confirmado !== undefined) data.confirmado = Boolean(body.confirmado);
  if (typeof body.pasesConfirmados === "number" && body.pasesConfirmados >= 0) data.pasesConfirmados = body.pasesConfirmados;
  if (body.fechaConfirmacion !== undefined) data.fechaConfirmacion = body.fechaConfirmacion === null ? null : (body.fechaConfirmacion ? new Date(body.fechaConfirmacion) : undefined);
  if (data.numero !== undefined) {
    const existente = await db.invitado.findFirst({ where: { numero: data.numero } });
    if (existente && existente.id !== id) {
      return NextResponse.json(
        { error: "Ya existe un invitado con ese número de teléfono. El teléfono es el identificador único." },
        { status: 400 }
      );
    }
  }
  try {
    const invitado = await db.invitado.update({
      where: { id },
      data,
    });
    return NextResponse.json(invitado);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
    }
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Ya existe un invitado con ese número" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  try {
    await db.invitado.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

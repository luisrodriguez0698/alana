import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("unauthorized");
  }
}

/**
 * GET /api/admin/invitados - Lista invitados (requiere sesión admin).
 * Query: search, estado (todos|confirmados|pendientes), page, limit
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const estado = request.nextUrl.searchParams.get("estado") ?? "todos";
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;
  const sortByParam = request.nextUrl.searchParams.get("sortBy") ?? "nombre";
  const sortOrderParam = request.nextUrl.searchParams.get("sortOrder") ?? "asc";
  const validSortColumns = ["confirmado", "nombre", "numero", "mesa", "pases", "pasesConfirmados", "fechaConfirmacion"] as const;
  const sortBy = validSortColumns.includes(sortByParam as (typeof validSortColumns)[number]) ? sortByParam : "nombre";
  const sortOrder = sortOrderParam === "desc" ? "desc" : "asc";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaWhere: any = {};
  if (estado === "confirmados") prismaWhere.confirmado = true;
  if (estado === "pendientes") prismaWhere.confirmado = false;
  if (search.trim()) {
    const term = search.trim();
    prismaWhere.OR = [
      { numero: { contains: term, mode: "insensitive" } },
      { nombre: { contains: term, mode: "insensitive" } },
    ];
  }

  const [invitados, total, stats] = await Promise.all([
    db.invitado.findMany({
      where: prismaWhere,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    db.invitado.count({ where: prismaWhere }),
    db.invitado.aggregate({
      _count: { id: true },
      _sum: { pasesConfirmados: true },
      where: { confirmado: true },
    }).then((r) => ({ confirmados: r._count.id, totalPersonas: r._sum.pasesConfirmados ?? 0 })),
  ]);
  const totalInvitados = await db.invitado.count();
  const totalPendientes = totalInvitados - stats.confirmados;

  return NextResponse.json({
    invitados: invitados.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      numero: i.numero,
      pases: i.pases,
      mesa: i.mesa,
      confirmado: i.confirmado,
      pasesConfirmados: i.pasesConfirmados,
      fechaConfirmacion: i.fechaConfirmacion?.toISOString() ?? null,
    })),
    total,
    page,
    limit,
    totalInvitados,
    totalConfirmados: stats.confirmados,
    totalPendientes,
    totalPersonas: stats.totalPersonas,
  });
}

/**
 * POST /api/admin/invitados - Crear invitado (requiere sesión admin).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let body: { nombre?: string; numero?: string; pases?: number; mesa?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const numero = body.numero?.replace(/\D/g, "").trim();
  if (!numero || !body.nombre?.trim()) {
    return NextResponse.json({ error: "Faltan nombre o número" }, { status: 400 });
  }
  const existente = await db.invitado.findFirst({ where: { numero } });
  if (existente) {
    return NextResponse.json(
      { error: "Ya existe un invitado con ese número de teléfono. El teléfono es el identificador único." },
      { status: 400 }
    );
  }
  const pases = typeof body.pases === "number" && body.pases >= 0 ? body.pases : 1;
  try {
    const invitado = await db.invitado.create({
      data: {
        nombre: body.nombre.trim(),
        numero,
        pases,
        mesa: body.mesa?.trim() || null,
      },
    });
    return NextResponse.json(invitado);
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002"
      ? "Ya existe un invitado con ese número"
      : "Error al crear";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

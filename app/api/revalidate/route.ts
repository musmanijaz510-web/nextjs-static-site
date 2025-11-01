import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => ({} as any));
  const path = typeof body?.path === "string" ? body.path : "/";
  revalidatePath(path);
  return Response.json({ revalidated: true, path });
}

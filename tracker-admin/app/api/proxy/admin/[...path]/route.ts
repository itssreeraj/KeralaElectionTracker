export const runtime = "nodejs";

import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_BACKEND_API_BASE; // http://localhost:8081/api

export async function GET(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export async function POST(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export async function PUT(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export async function DELETE(req: Request, ctx: any) {
  return proxy(req, ctx);
}

async function proxy(req: Request, ctx: any) {
  const params = await ctx.params;   // ✅ Next.js 16 fix

  const cookieStore = await cookies();
  const token = cookieStore.get("ADMIN_TOKEN")?.value;

  console.log("🔥 PROXY HIT");
  console.log("TOKEN =", token);
  console.log("PARAMS =", params);

  const url = `${BACKEND}/v1/admin/${params.path.join("/")}`;
  console.log("FORWARDING TO =", url);

  return fetch(url, {
    method: req.method,
    credentials: "include",
    body: req.method === "GET" ? undefined : await req.text(),
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
  });
}

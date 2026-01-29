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
  const params = await ctx.params;
  const incomingUrl = new URL(req.url);

  const path = params.path.join("/");
  const query = incomingUrl.search;

  const backendUrl = `${BACKEND}/v1/admin/${path}${query}`;

  const cookieStore = await cookies();
  const token = cookieStore.get("ADMIN_TOKEN")?.value;

  console.log("🔥 PROXY HIT");
  console.log("TOKEN =", token);
  console.log("PARAMS =", params);

  console.log("ADMIN PROXY →", backendUrl);

  return fetch(backendUrl, {
    method: req.method,
    credentials: "include",
    body: req.method === "GET" ? undefined : await req.text(),
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
  });
}

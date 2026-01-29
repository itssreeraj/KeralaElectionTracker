export const runtime = "nodejs";

const BACKEND = process.env.NEXT_BACKEND_API_BASE!;

export async function GET(req: Request, ctx: any) {
  return proxy(req, ctx);
}
export async function POST(req: Request, ctx: any) {
  return proxy(req, ctx);
}

async function proxy(req: Request, ctx: any) {
  const params = await ctx.params;
  const incomingUrl = new URL(req.url);

  const path = params.path.join("/");
  const query = incomingUrl.search;

  const backendUrl = `${BACKEND}/v1/public/${path}${query}`;

  console.log("PUBLIC PROXY →", backendUrl);

  return fetch(backendUrl, {
    method: req.method,
    credentials: "include",
    body: req.method === "GET" ? undefined : await req.text(),
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
  });
}

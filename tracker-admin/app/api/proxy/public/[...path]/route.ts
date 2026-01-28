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
  const url = `${BACKEND}/v1/public/${params.path.join("/")}`;

  console.log("PUBLIC PROXY →", url);

  return fetch(url, {
    method: req.method,
    credentials: "include",
    body: req.method === "GET" ? undefined : await req.text(),
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
  });
}

export const runtime = "nodejs";

import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_BACKEND_API_BASE;

const logger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [ADMIN_PROXY] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ADMIN_PROXY_ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
};

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
  const startTime = Date.now();
  
  if (!BACKEND) {
    logger.error('NEXT_BACKEND_API_BASE environment variable not configured');
    return new Response(JSON.stringify({ error: "Backend API base not configured" }), { status: 500 });
  }

  const params = await ctx.params;
  const incomingUrl = new URL(req.url);

  const path = params.path.join("/");
  const query = incomingUrl.search;

  const backendUrl = `${BACKEND}/v1/admin/${path}${query}`;

  const cookieStore = await cookies();
  const token = cookieStore.get("ADMIN_TOKEN")?.value;
  const hasToken = !!token;

  logger.log('Admin proxy request initiated', {
    method: req.method,
    path: path,
    fullUrl: backendUrl,
    hasToken,
    contentType: req.headers.get('content-type'),
    backend: BACKEND,
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    const requestBody = req.method === "GET" ? undefined : await req.text();
    const bodySize = requestBody ? Buffer.byteLength(requestBody) : 0;

    logger.log('Sending request to backend', {
      method: req.method,
      path,
      bodySize: `${bodySize} bytes`,
      hasAuth: hasToken,
    });

    const response = await fetch(backendUrl, {
      method: req.method,
      credentials: "include",
      body: requestBody,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": req.headers.get("content-type") || "application/json",
      },
    });

    const duration = Date.now() - startTime;
    logger.log('Backend response received', {
      method: req.method,
      path,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      size: response.headers.get('content-length') || 'unknown',
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Proxy request failed', {
      method: req.method,
      path,
      backendUrl,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(JSON.stringify({ error: "Proxy request failed" }), { status: 502 });
  }
}

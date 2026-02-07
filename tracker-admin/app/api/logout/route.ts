import { NextResponse } from "next/server";

const logger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [LOGOUT] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [LOGOUT_ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
};

export async function POST(req: Request) {
  const startTime = Date.now();
  logger.log('Logout request received', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  try {
    const res = NextResponse.json({ success: true });
    res.cookies.set("ADMIN_TOKEN", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    
    const duration = Date.now() - startTime;
    logger.log('Logout successful - token cleared', { duration: `${duration}ms` });
    return res;
  } catch (error) {
    logger.error('Logout request failed', {
      error: error instanceof Error ? error.message : String(error),
      duration: `${Date.now() - startTime}ms`,
    });
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
